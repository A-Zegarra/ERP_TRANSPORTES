import importlib.util
import json
from pathlib import Path
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("hp_network", Path(__file__).resolve().parents[1] / "scripts/hp-verificar-red.py")
network = importlib.util.module_from_spec(spec)
spec.loader.exec_module(network)


def response(status=200, body=None, headers=None, code=0):
    return {"exit": code, "status": status, "body": json.dumps(network.EXPECTED) if body is None else body, "headers": headers or {}}


class NetworkTests(unittest.TestCase):
    def test_real_local_http_health_and_redirect_without_following(self):
        visited = []

        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                visited.append(self.path)
                if self.path == "/redirect":
                    self.send_response(302)
                    self.send_header("Location", "/private?token=never-print-this")
                    self.end_headers()
                else:
                    self.send_response(200)
                    self.end_headers()
                    self.wfile.write(json.dumps(network.EXPECTED).encode())

            def log_message(self, *args):
                pass

        server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        self.addCleanup(thread.join, 2)
        self.addCleanup(server.server_close)
        self.addCleanup(server.shutdown)
        base = "http://127.0.0.1:" + str(server.server_port)
        self.assertEqual(network.classify(network.probe(base))["kind"], "ok")
        result = network.classify(network.probe(base + "/redirect"))
        self.assertEqual(result["kind"], "redirect")
        self.assertNotIn("token", json.dumps(result))
        self.assertNotIn("/private?token=never-print-this", visited)

    def test_separates_dns_tls_http_access_and_wrong_application(self):
        self.assertEqual(network.classify(response(code=6))["kind"], "dns")
        self.assertEqual(network.classify(response(code=60))["kind"], "tls")
        self.assertEqual(network.classify(response(body='{"status":"ok","service":"other"}'))["kind"], "http")
        self.assertIn("1033", network.classify(response(530, "<h1>Error <span>1033</span></h1>"))["detail"])
        access = network.classify(response(302, "", {"location": "https://team.cloudflareaccess.com/cdn-cgi/access/login?token=secret"}))
        self.assertIn("Access", access["detail"])
        self.assertNotIn("secret", json.dumps(access))
        self.assertEqual(network.classify(response(403, "", {"cf-mitigated": "challenge"}))["kind"], "challenge")

    def test_distinguishes_system_dns_failure_from_public_nxdomain_and_network_failure(self):
        ok = {"kind": "ok"}
        no_dns = {"kind": "dns"}
        positive = [{"status": 0}, {"status": 0}]
        self.assertIn("resolver/caché", network.conclusion([ok, ok], no_dns, [ok], positive))
        self.assertNotIn("resolver/caché", network.conclusion([ok, ok], {"kind": "timeout"}, [ok], positive))
        self.assertIn("NXDOMAIN", network.conclusion([ok, ok], no_dns, [], [{"status": 3}, {"status": 3}]))
        self.assertNotIn("NXDOMAIN", network.conclusion([ok, ok], no_dns, [], [{"status": None}, {"status": None}]))
        self.assertIn("recuperar un servicio local", network.conclusion([no_dns, ok], ok, [ok], positive))

    def test_dns_answers_must_be_public_ipv4_addresses(self):
        body = json.dumps({"Status": 0, "Answer": [
            {"type": 1, "data": "1.1.1.1"}, {"type": 1, "data": "127.0.0.1"},
            {"type": 1, "data": "10.0.0.1"}, {"type": 28, "data": "::1"},
        ]})
        with patch.object(network, "probe", return_value=response(body=body)):
            self.assertEqual(network.public_dns("Cloudflare")["ips"], ["1.1.1.1"])
        with patch.object(network, "probe", return_value=response(body="[]")):
            self.assertIsNone(network.public_dns("Cloudflare")["status"])
        with patch.object(network, "probe", return_value=response(body='{"Status":3}')):
            self.assertEqual(network.public_dns("Google")["status"], 3)


if __name__ == "__main__":
    unittest.main()
