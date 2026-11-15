"""Source resume must preserve cached evidence and obey an active cooldown."""
import hashlib,json,sys,tempfile,time,unittest
from pathlib import Path
from unittest.mock import Mock
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from prepare_context_imagery import RemoteTIFF

class ResumeTests(unittest.TestCase):
    def remote(self,folder):
        r=RemoteTIFF.__new__(RemoteTIFF);r.root=Path(folder);r.blocks={};r.block_size=4;r.total=4;r.network_bytes=0;r.known_hashes={};return r
    def test_corrupt_cached_bytes_are_rejected_before_network(self):
        with tempfile.TemporaryDirectory() as folder:
            r=self.remote(folder);r.known_hashes={(0,3):hashlib.sha256(b'good').hexdigest()};p=Path(folder)/'0-3.bin';p.write_bytes(b'evil');r.receive=Mock(side_effect=AssertionError('Network must not run'))
            with self.assertRaisesRegex(ValueError,'provenance hash'):r.block(0)
            r.receive.assert_not_called();self.assertEqual(p.read_bytes(),b'evil');self.assertEqual(r.blocks,{})
    def test_active_cooldown_exits_without_waiting_or_receiving(self):
        with tempfile.TemporaryDirectory() as folder:
            r=self.remote(folder);record={'retryNotBeforeEpoch':time.time()+3600};p=Path(folder)/'rate-limit.json';p.write_text(json.dumps(record))
            start=time.monotonic()
            with self.assertRaisesRegex(RuntimeError,'retry window active'):r.receive(0,3)
            self.assertLess(time.monotonic()-start,1);self.assertEqual(r.network_bytes,0);self.assertEqual(json.loads(p.read_text()),record)

if __name__=='__main__':unittest.main()
