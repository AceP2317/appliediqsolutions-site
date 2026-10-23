/* THE BAND D19 GOVERNS, SENTENCE BY SENTENCE.
   Every sentence in the "Why this, why here" band on /main-street/ is listed here, in page order, as
   one of two kinds. HISTORY carries the links it rests on and the day they were read. VOICE states
   no historical fact and may hold no year. scripts/lib/fact-lock.mjs compares this list with the
   band, so `npm run gate` and the commit guard both refuse a sentence added to the page without a
   line here, a historical line with no source, and a line whose sentence has left the page.

   Reword a sentence on the page and its line here in the same commit. The text must match the page
   exactly, curly apostrophes and dashes included.

   NOTHING AUTOMATED EVER OPENS THESE LINKS (L-248). Several belong to neighbors this practice is
   approaching. A person re-reads them, and `read` says when one last did. */

export const FACT_LOCK_BAND = {
  page: 'main-street/index.html',
  source: 'src/pages/main-street.astro',
  id: 'why-here',
};

export const SENTENCES = [
  { kind: 'voice', text: 'Why this, why here' },
  { kind: 'voice', text: 'The dream, close to home.' },
  { kind: 'voice', text: 'For years, real custom software was something only big companies could afford.' },
  { kind: 'voice', text: 'The local business made do — rented templates, off-the-shelf subscriptions, and workarounds nobody liked.' },
  { kind: 'voice', text: 'AI changed that.' },
  { kind: 'voice', text: 'The shop running on spreadsheets can have its data turned into a working tool today, and own the custom system it runs on tomorrow — no enterprise budget, no license, no asking permission.' },
  { kind: 'voice', text: 'I wasn’t born here.' },
  { kind: 'voice', text: 'I chose it — New Bern is home, and it’s where I’ll always start.' },
  { kind: 'voice', text: 'The businesses that make this town what it is deserve tools built for them — not hand-me-downs from software designed for a company ten times their size.' },
  { kind: 'voice', text: 'If you run a small business here, or anywhere nearby, this is for you.' },
  { kind: 'voice', text: 'I built New Bern in Time, a 3D model of downtown — drag through the years to watch the town grow, or tap any building for how sure the model is and where that comes from.' },
  {
    kind: 'history',
    text: 'Tryon Palace went up in 1770, and this was the capital of North Carolina — until the state bought land for Raleigh in 1792 and the legislature moved there in 1794.',
    read: '2026-10-23',
    sources: [
      'https://www.tryonpalace.org/palace',
      'https://www.ncpedia.org/tryon-palace',
      'https://www.ncpedia.org/raleigh/timeline',
    ],
    note: 'Tryon Palace: "Completed in 1770", the first permanent capitol, and it housed the state governors until 1794. NCpedia (Barefoot, 2006): the legislature met at the palace for the final time in 1794, ending its reign as the state\'s seat of government. NCpedia\'s Raleigh timeline: 1,000 acres bought from Joel Lane on 5 April 1792, and the General Assembly first met in Raleigh in December 1794. The same timeline says sessions moved between towns before 1788, so "the capital" rests on the palace being the seat of government, which is NCpedia\'s own wording.',
  },
  {
    kind: 'history',
    text: 'Caleb Bradham mixed the drink that became Pepsi in his pharmacy at Middle and Pollock in 1893.',
    read: '2026-10-23',
    sources: [
      'https://www.ncpedia.org/pepsi-cola',
      'https://newbernhistorical.org/this-month-in-new-bern-august-2015/',
    ],
    note: 'NCpedia: first concocted "at a pharmacy at Pollock and Middle Streets in New Bern in 1893". New Bern Historical Society: "Beginning in 1893", served "from the soda fountain in his pharmacy at the corner of Pollock and Middle Streets", and named Pepsi-Cola on 28 August 1898. The page shipped saying 1898 on 2026-07-12, which is the error D19 was written after; 1898 is the rename. Two sources read the same day are vaguer and do not contradict it: NCpedia\'s biography of Bradham (Dictionary of North Carolina Biography, 1979) says "the late 1890s", and marker C-60 says "the mid-1890s".',
  },
  {
    kind: 'history',
    text: 'He bet the company on sugar, the market collapsed, and by ’23 he was bankrupt.',
    read: '2026-10-23',
    sources: [
      'https://newbernhistorical.org/this-month-in-new-bern-may-2018/',
      'https://www.dncr.nc.gov/index%2Ephp/blog/2023/12/07/caleb-bradham-1867-1934-c-60',
      'https://www.ncpedia.org/pepsi-cola',
    ],
    note: 'New Bern Historical Society: he bought sugar at 28 cents a pound and "the price plummeted to five cents per pound", and "Bradham was forced to file for bankruptcy in May 1923". NC Department of Natural and Cultural Resources, marker C-60: "sugar prices spiked and fell, leading to his bankruptcy", and in 1923 he sold the trademark and business. NCpedia: "Bradham invested heavily in sugar".',
  },
  {
    kind: 'history',
    text: 'The drink he invented belongs to PepsiCo today, headquartered in Purchase, New York; he went back to running his drugstore.',
    read: '2026-10-23',
    sources: [
      'https://www.sec.gov/Archives/edgar/data/77476/000007747626000007/pep-20251227.htm',
      'https://newbernhistorical.org/this-month-in-new-bern-may-2018/',
    ],
    note: 'PepsiCo\'s 10-K for the fiscal year ended 27 December 2025 lists Pepsi-Cola among its brands and gives its principal executive offices as 700 Anderson Hill Road, Purchase, New York. "Today" is that filing, so re-read the next 10-K when it is filed. Until 2026-10-23 this sentence began "The company he invented is headquartered in Purchase", and Ian chose this wording that day: the same filing says PepsiCo was "incorporated in Delaware in 1919", so it owns the drink he invented and is not the company he founded. New Bern Historical Society: "Caleb Bradham returned to his pharmacy" before he died in 1934.',
  },
  { kind: 'voice', text: 'New Bern has built things the world wanted.' },
  { kind: 'voice', text: 'It hasn’t always gotten to keep them.' },
  { kind: 'voice', text: 'That’s the whole reason everything I build is yours to own.' },
  {
    kind: 'history',
    text: 'New Bern has been a Main Street town since 1980 — one of the first five in North Carolina.',
    read: '2026-10-23',
    sources: [
      'https://downtownnewbern.com/about/',
      'https://commerce.nc.gov/news/press-releases/2023/09/20/more-52-billion-invested-north-carolina-main-street-communities-1980',
      'https://www.witn.com/2026/06/23/new-bern-revitalization-efforts-rewarded-with-national-accreditation-2026/',
    ],
    note: 'Swiss Bear\'s About page: founded in 1979, and "Just a year later, New Bern was selected as one of five North Carolina towns to participate in the state\'s inaugural Main Street program." NC Commerce counts the program\'s investment "Since 1980". D19 records that the same site\'s homepage once said thirty and the About page is the correct half; a search on 2026-10-23 still returned "original 30" from it. WITN, 23 June 2026: the city "again has earned the Main Street America Accreditation for 2026", which is what keeps "has been" true today. A Carolina Planning article found in a search, and not opened, dates the selection to 1981.',
  },
  { kind: 'voice', text: 'Let’s build the next big thing here, and keep it this time.' },
];
