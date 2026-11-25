// Staple's file counts, read at build time from the file Staple publishes beside its pages, so this site
// never types a count about another repository (ian-provencher D123). A failed read, or a file that fails
// the checks below, warns in the build log and falls back to a sentence with no figure that points at
// Staple's own Code languages page. The copy never says "appliance": this site already names the plant in
// town, so a sentence carrying the word is refused like a malformed one.

export const STAPLE_COUNTS = 'https://acep2317.github.io/staple/languages.json';
export const STAPLE_LANGUAGES_PAGE = 'https://acep2317.github.io/staple/languages.html';
const LANGUAGES = ['Python', 'SQL', 'JavaScript', 'Bash', 'HTML', 'CSS'];

export function faults(d) {
  if (!d || typeof d !== 'object' || Array.isArray(d)) return ['the file is not a JSON object'];
  const out = [];
  const { sentence, counts, page } = d;
  if (typeof sentence !== 'string' || !sentence.startsWith('Written in ')) out.push('the sentence does not open "Written in "');
  if (typeof sentence === 'string' && /appliance/i.test(sentence)) out.push('the sentence says "appliance"');
  if (!counts || typeof counts !== 'object') out.push('there are no counts');
  else for (const lang of LANGUAGES) {
    if (!Number.isInteger(counts[lang]) || counts[lang] < 0) out.push(`the ${lang} count is not a whole number`);
  }
  if (typeof sentence === 'string' && Number.isInteger(counts?.Python) && !sentence.includes(`${counts.Python} Python files`)) {
    out.push('the sentence disagrees with the Python count');
  }
  if (typeof page !== 'string' || !page.startsWith('https://')) out.push('the page is not an https address');
  return out;
}

export async function stapleCounts(url = STAPLE_COUNTS) {
  const fallback = (why) => {
    console.warn(`staple: ${why}; the work page shows its sentence with no figure`);
    return {
      fallback: true,
      sentence: 'Staple’s Code languages page counts every file by the language it is written in.',
      page: STAPLE_LANGUAGES_PAGE,
    };
  };
  let d;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return fallback(`${url} answered ${res.status}`);
    d = await res.json();
  } catch (e) {
    return fallback(`${url} could not be read (${e?.message ?? e})`);
  }
  const bad = faults(d);
  if (bad.length) return fallback(`${url} was refused: ${bad.join('; ')}`);
  return { fallback: false, sentence: d.sentence, page: d.page };
}
