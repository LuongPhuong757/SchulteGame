// Basic nickname blocklist (ID-01, D-04). DRAFT by Claude, reviewed by a human
// at the Plan 01-04 checkpoint before the phase completes.
//
// Policy: short and conservative. A false negative (an offensive name slips
// through) is preferred over blocking a real Vietnamese name. Entries are data
// only; matching rules live in nickname.ts. nickname.test.ts proves that every
// entry is enforced and that common names are not caught.
//
// Category tags: vi-vulgar | vi-teencode | en-profanity

// Whole-token match against the NFC lowercase form WITH diacritics kept.
// Used for words whose diacritic-folded spelling collides with innocent words
// (folded, these would block "Lớn", "Các", "Buổi", "Dụ", ...), so only the
// exact accented spelling is rejected.
export const BLOCKED_ACCENTED_TOKENS: readonly string[] = [
  'đụ', // vi-vulgar
  'địt', // vi-vulgar
  'lồn', // vi-vulgar
  'cặc', // vi-vulgar
  'buồi', // vi-vulgar
  'đéo', // vi-vulgar
  'đĩ', // vi-vulgar
  'cứt', // vi-vulgar
];

// Whole-token match after diacritic folding, lowercase and digit substitution
// (0->o, 1->i, 3->e, 4->a). Entries are letters only (digits are mapped away
// before matching) and must never equal the folded form of an everyday
// Vietnamese syllable or name.
export const BLOCKED_FOLDED_TOKENS: readonly string[] = [
  'dm', // vi-teencode
  'dmm', // vi-teencode
  'dcm', // vi-teencode
  'dkm', // vi-teencode
  'vcl', // vi-teencode
  'vkl', // vi-teencode
  'clm', // vi-teencode
  'cmm', // vi-teencode
  'fuck', // en-profanity
  'shit', // en-profanity
  'bitch', // en-profanity
  'cunt', // en-profanity
  'pussy', // en-profanity
  'whore', // en-profanity
  'slut', // en-profanity
  'nigger', // en-profanity
  'nigga', // en-profanity
  'faggot', // en-profanity
  'asshole', // en-profanity
  'bastard', // en-profanity
];

// Substring match inside the separator-stripped, folded string. Only long
// (5-8 letter) compacted insults that are unambiguous even inside other text.
export const BLOCKED_FOLDED_SUBSTRINGS: readonly string[] = [
  'ditme', // vi-vulgar
  'dumemay', // vi-vulgar
  'concac', // vi-vulgar
  'fucker', // en-profanity
  'fucking', // en-profanity
  'dickhead', // en-profanity
  'bullshit', // en-profanity
];
