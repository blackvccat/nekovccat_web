"""网易云歌单列表：解析、补齐缺失曲目、限流上限、缓存，以及只经共享 token 暴露的路由。"""
import asyncio
import unittest
from unittest.mock import patch

import httpx

from app.main import app
from app.services import netease_music
from app.services.netease_music import PlaylistError, clamp_limit, merge, playlist_tracks, track_ids

TOKEN = "test-internal-token-" + "x" * 40


def song(song_id: int, name: str | None = None) -> dict:
    return {"id": song_id, "name": name or f"第 {song_id} 首", "ar": [{"name": "歌手"}], "al": {"name": "专辑"}, "dt": 200000}


def detail(count=42, inlined=10, **overrides):
    """用户歌单的样子：trackIds 是全的，tracks 只有前 10 首。"""
    body = {
        "name": "fortuna",
        "trackCount": count,
        "trackIds": [{"id": 1000 + index} for index in range(count)],
        "tracks": [song(1000 + index) for index in range(min(inlined, count))],
    }
    body.update(overrides)
    return body


class MergeTests(unittest.TestCase):
    def test_track_ids_follow_the_playlist_order_and_the_limit(self):
        body = detail()
        self.assertEqual(track_ids(body, body["tracks"], 50)[:2], ["1000", "1001"])
        self.assertEqual(len(track_ids(body, body["tracks"], 4)), 4)
        self.assertEqual(track_ids({"tracks": body["tracks"]}, body["tracks"], 50)[:2], ["1000", "1001"])
        self.assertEqual(track_ids({}, [], 50), [])

    def test_inlined_and_hydrated_tracks_are_merged_in_playlist_order(self):
        body = detail(count=42, inlined=10)
        hydrated = [song(1000 + index) for index in range(10, 42)]
        data = merge(body, body["tracks"], hydrated, "3778678", 50)
        self.assertEqual(data["name"], "fortuna")
        self.assertEqual(data["total"], 42)
        self.assertEqual(len(data["tracks"]), 42)
        self.assertEqual([track["id"] for track in data["tracks"]][:3], ["1000", "1001", "1002"])
        self.assertEqual(data["tracks"][-1]["id"], "1041")
        self.assertEqual(data["tracks"][0], {"id": "1000", "name": "第 1000 首", "artists": "歌手", "album": "专辑", "durationMs": 200000})

    def test_broken_entries_are_dropped_and_counts_fall_back(self):
        body = detail(count=3, inlined=0)
        data = merge(body, [{"id": 1}, {"name": "没有 id"}, "不是对象", song(1001)], [], "1", 50)
        self.assertEqual([track["id"] for track in data["tracks"]], ["1001"])
        self.assertEqual(data["total"], 3, "trackCount 缺失以外的字段不要影响总数")
        self.assertEqual(merge({"tracks": []}, [], [], "1", 50)["total"], 0)

    def test_hydrated_tracks_use_the_legacy_field_names(self):
        """/api/song/detail 回来的还是 artists/album/duration，别把它当成没有作者。"""
        legacy = {"id": 1001, "name": "Carousel", "artists": [{"name": "Mano Pupo"}], "album": {"name": "AO SOM DA TROMBETA"}, "duration": 284439}
        body = {"trackIds": [{"id": 1001}], "tracks": [], "trackCount": 1}
        data = merge(body, [], [legacy], "1", 50)
        self.assertEqual(data["tracks"], [{"id": "1001", "name": "Carousel", "artists": "Mano Pupo", "album": "AO SOM DA TROMBETA", "durationMs": 284439}])

    def test_limit_is_clamped_to_the_allowed_window(self):
        self.assertEqual(clamp_limit(0), 1)
        self.assertEqual(clamp_limit(-5), 1)
        self.assertEqual(clamp_limit(50), 50)
        self.assertEqual(clamp_limit(9999), netease_music.MAX_TRACKS)
        self.assertEqual(clamp_limit("abc"), netease_music.DEFAULT_TRACKS)


class PlaylistServiceTests(unittest.TestCase):
    def setUp(self):
        netease_music.clear_cache()

    def tearDown(self):
        netease_music.clear_cache()

    def test_bad_ids_never_reach_the_network(self):
        calls = []

        async def fetch_playlist(playlist_id, limit):
            calls.append(playlist_id)
            return {"playlist": detail()}

        with patch.object(netease_music, "_fetch_playlist", fetch_playlist):
            for bad in ["", "abc", "12ab", "../../etc", "1" * 21, "https://music.163.com/playlist?id=1"]:
                with self.assertRaises(PlaylistError) as caught:
                    asyncio.run(playlist_tracks(bad))
                self.assertEqual(caught.exception.status, 400)
        self.assertEqual(calls, [])

    def test_a_user_playlist_is_topped_up_by_track_ids(self):
        asked = []

        async def fetch_playlist(playlist_id, limit):
            return {"playlist": detail(count=42, inlined=10)}

        async def fetch_songs(ids):
            asked.append(ids)
            return [song(1000 + index) for index in range(10, 42)]

        with patch.object(netease_music, "_fetch_playlist", fetch_playlist), patch.object(netease_music, "_fetch_songs", fetch_songs):
            data = asyncio.run(playlist_tracks("3778678", 50))
        self.assertEqual(len(data["tracks"]), 42, "trackIds 里的 42 首都要在列表里")
        self.assertEqual([len(asked), asked[0][0], asked[0][-1]], [1, "1010", "1041"], "只补内联里缺的那 32 首，顺序按歌单")

    def test_a_chart_that_inlines_everything_needs_one_request(self):
        def fetch_songs(ids):
            raise AssertionError("官方榜单已经把曲目都内联了，不该再补请求")

        async def fetch_playlist(playlist_id, limit):
            return {"playlist": detail(count=200, inlined=50)}

        with patch.object(netease_music, "_fetch_playlist", fetch_playlist), patch.object(netease_music, "_fetch_songs", fetch_songs):
            data = asyncio.run(playlist_tracks("3778678", 50))
        self.assertEqual(len(data["tracks"]), 50)

    def test_results_are_cached_and_reused(self):
        calls = []

        async def fetch_playlist(playlist_id, limit):
            calls.append((playlist_id, limit))
            return {"playlist": detail(count=3, inlined=3)}

        with patch.object(netease_music, "_fetch_playlist", fetch_playlist):
            first = asyncio.run(playlist_tracks("3778678", 50))
            second = asyncio.run(playlist_tracks("3778678", 50))
            third = asyncio.run(playlist_tracks("3778678", 20))
        self.assertEqual(first, second)
        self.assertEqual(calls, [("3778678", 50), ("3778678", 20)], "同一份结果要复用，不同条数是不同的键")

    def test_missing_playlist_is_a_404_and_network_failure_is_a_503(self):
        async def empty(playlist_id, limit):
            return {"playlist": None}

        with patch.object(netease_music, "_fetch_playlist", empty):
            with self.assertRaises(PlaylistError) as caught:
                asyncio.run(playlist_tracks("1"))
        self.assertEqual(caught.exception.status, 404)

        async def boom(playlist_id, limit):
            raise httpx.ConnectError("no route")

        with patch.object(netease_music, "_fetch_playlist", boom):
            with self.assertRaises(PlaylistError) as caught:
                asyncio.run(playlist_tracks("3778678"))
        self.assertEqual(caught.exception.status, 503)


class PlaylistRouteTests(unittest.TestCase):
    def setUp(self):
        netease_music.clear_cache()

    def _get(self, path, headers=None):
        async def run():
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
                return await client.get(path, headers=headers or {})

        return asyncio.run(run())

    def test_route_returns_the_normalized_list(self):
        async def fetch_playlist(playlist_id, limit):
            return {"playlist": detail(count=3, inlined=3)}

        with patch.object(netease_music, "_fetch_playlist", fetch_playlist):
            response = self._get("/api/music/netease/playlist/3778678?limit=50")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["name"], "fortuna")
        self.assertEqual(len(body["tracks"]), 3)

    def test_route_rejects_a_bad_id_and_reports_upstream_failures(self):
        self.assertEqual(self._get("/api/music/netease/playlist/abc").status_code, 400)
        self.assertEqual(self._get("/api/music/netease/playlist/3778678?limit=500").status_code, 422)

        async def boom(playlist_id, limit):
            raise PlaylistError("暂时拿不到这个歌单，请稍后再试。", 503)

        with patch.object(netease_music, "_fetch_playlist", boom):
            response = self._get("/api/music/netease/playlist/3778678")
        self.assertEqual(response.status_code, 503)
        self.assertIn("暂时拿不到", response.json()["detail"])


if __name__ == "__main__":
    unittest.main()
