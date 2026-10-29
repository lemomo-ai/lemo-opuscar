import unittest
from detect import extract_narration, measure


class ExtractionTests(unittest.TestCase):
    def test_metadata_and_nonspoken_banned_words_excluded(self):
        body = extract_narration('# 标题赋能\n## 口播\n这是口播。\n## 来源注（不口播）\n闭环')
        self.assertEqual(body, '这是口播。')
        self.assertFalse(any(value > limit for _, value, limit, _ in measure(body)[2]))

    def test_missing_and_mixed_sections_rejected(self):
        for text in ['# no speech', '## 口播\n', '## 口播\n### notes\nfoo']:
            with self.assertRaises(ValueError):
                extract_narration(text)

    def test_threshold_detects_fillers_and_long_sentence(self):
        rows = {name: value for name, value, _, _ in measure('值得注意的是，' + '字' * 46 + '。')[2]}
        self.assertEqual(rows['stock_phrases'], 1)
        self.assertEqual(rows['long_sentences_over_45'], 1)


if __name__ == '__main__':
    unittest.main()
