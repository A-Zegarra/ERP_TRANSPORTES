import importlib.util
from pathlib import Path
import tempfile
import unittest

MODULE = Path(__file__).resolve().parents[1] / "scripts/hp_cloudflare.py"
spec = importlib.util.spec_from_file_location("hp_cloudflare", MODULE)
cf = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cf)

CONFIG = """# conservar comentario y opciones
tunnel: 11111111-1111-1111-1111-111111111111
credentials-file: /etc/cloudflared/conector.json
originRequest:
  connectTimeout: 30s
ingress:
  # las aplicaciones existentes
  - hostname: cardlink.example.com
    service: http://localhost:3001
  - hostname: '*.example.com'
    service: http://localhost:3002
  - service: http_status:404
"""
HOST = "larams.example.com"


class CloudflareTests(unittest.TestCase):
    def test_preserves_every_existing_rule_and_comment(self):
        result, before, changed = cf.prepare(CONFIG, HOST)
        self.assertTrue(changed)
        addition = "  - hostname: larams.example.com\n    service: http://127.0.0.1:3100\n"
        self.assertEqual(result.replace(addition, "", 1), CONFIG)
        after = cf.load_config(result)
        self.assertEqual(after["ingress"][1:], before["ingress"])
        self.assertEqual(after["originRequest"], before["originRequest"])
        self.assertEqual(after["ingress"][0]["hostname"], HOST)

    def test_idempotent(self):
        once, _, _ = cf.prepare(CONFIG, HOST)
        twice, _, changed = cf.prepare(once, HOST)
        self.assertEqual(once, twice)
        self.assertFalse(changed)

    def test_conflicting_hostname_and_hidden_rule_are_rejected(self):
        for service in ["http://localhost:9999", cf.SERVICE]:
            config = CONFIG.replace("cardlink.example.com", HOST).replace("http://localhost:3001", service)
            if service == cf.SERVICE:
                config = config.replace("ingress:\n", "ingress:\n  - hostname: '*.example.com'\n    service: http://localhost:3009\n")
            with self.assertRaises(cf.SafeError):
                cf.prepare(config, HOST)

    def test_rejects_credentials_in_config_duplicate_keys_and_inline_formats(self):
        for text in [
            CONFIG + "token: private-value\n",
            CONFIG + "tunnel: duplicate\n",
            CONFIG.replace("    service: http://localhost:3001", "    service: http://localhost:3001\n    service: http://localhost:9999"),
            "tunnel: 11111111-1111-1111-1111-111111111111\ningress: [{service: 'http_status:404'}]\n",
        ]:
            with self.assertRaises(cf.SafeError):
                cf.prepare(text, HOST)

    def test_supports_unindented_lists_and_crlf(self):
        config = CONFIG.replace("  - ", "- ").replace("    service:", "  service:")
        for original in [config, CONFIG.replace("\n", "\r\n")]:
            result, before, _ = cf.prepare(original, HOST)
            self.assertEqual(cf.load_config(result)["ingress"][1:], before["ingress"])
        result, _, _ = cf.prepare(CONFIG.replace("\n", "\r\n"), HOST)
        self.assertNotIn("\n", result.replace("\r\n", ""))

    def test_does_not_overwrite_concurrent_config_change(self):
        import hashlib
        with tempfile.TemporaryDirectory() as directory:
            original = Path(directory) / "config.yml"
            candidate = Path(directory) / "candidate.yml"
            original.write_text(CONFIG)
            digest = hashlib.sha256(original.read_bytes()).hexdigest()
            candidate.write_text(cf.prepare(CONFIG, HOST)[0])
            original.write_text(CONFIG + "# edited by another operator\n")
            with self.assertRaises(cf.SafeError):
                cf.replace_if_unchanged(original, candidate, digest)
            self.assertTrue(original.read_text().endswith("# edited by another operator\n"))
            self.assertTrue(candidate.exists())

    def test_rejects_hostname_injection(self):
        for hostname in ["larams.example.com\nfoo: bar", "*.example.com", "-larams.example.com", "localhost"]:
            with self.assertRaises(cf.SafeError):
                cf.prepare(CONFIG, hostname)


if __name__ == "__main__":
    unittest.main()
