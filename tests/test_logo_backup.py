import hashlib
import importlib.util
import json
from pathlib import Path
import tarfile
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("hp_mysql", Path(__file__).resolve().parents[1] / "scripts/hp_mysql.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class LogoBackupTests(unittest.TestCase):
    def test_round_trip_and_refuse_corruption_or_links(self):
        with tempfile.TemporaryDirectory() as temporary:
            shared = Path(temporary)
            company = shared / "logos/00000000-0000-4000-8000-000000000001"
            company.mkdir(parents=True, mode=0o700)
            company.parent.chmod(0o700)
            content = b"immutable logo bytes"
            sha = hashlib.sha256(content).hexdigest()
            logo = company / (sha + ".webp")
            logo.write_bytes(content)
            logo.chmod(0o600)
            target = shared / "test.sql.gz"
            archive = module.backup_logos(shared, target)
            manifest = json.loads((shared / "test.backup.json").read_text())
            self.assertEqual(hashlib.sha256(archive.read_bytes()).hexdigest(), manifest["logosSha256"])
            with tarfile.open(archive) as saved:
                self.assertEqual(saved.extractfile("logos/" + company.name + "/" + logo.name).read(), content)
            self.assertEqual(archive.stat().st_mode & 0o077, 0)
            logo.write_bytes(b"changed")
            with self.assertRaises(module.SafeError):
                module.backup_logos(shared, shared / "corrupt.sql.gz")
            self.assertFalse((shared / "corrupt.backup.json").exists())
            logo.unlink()
            logo.symlink_to(target)
            with self.assertRaises(module.SafeError):
                module.backup_logos(shared, shared / "link.sql.gz")

    def test_empty_before_first_upload(self):
        with tempfile.TemporaryDirectory() as temporary:
            shared = Path(temporary)
            archive = module.backup_logos(shared, shared / "empty.sql.gz")
            with tarfile.open(archive) as saved:
                self.assertEqual(saved.getnames(), [])


if __name__ == "__main__":
    unittest.main()
