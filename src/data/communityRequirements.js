export const communityRequirements = {
  comm1: {
    title: 'Purity commitment application',
    reviewTime: 'Usually reviewed within 2–3 days',
    privacyNote: 'Your answers are private and visible only to authorised community reviewers.',
    sharedCommunityNote: 'Approved Virgins and Sexual Puritans join the same community and receive the same growth content.',
    paths: [
      {
        id: 'virgin',
        label: 'Virgin',
        description: 'This describes someone who has never had penetrative sex before and has not condoned a life of progressive sexual immorality such as smooching, masturbation, oral sex, anal sex, or other similar vices. It is possible that the person crossed the line of purity a few times. However, for the largest part, they have kept themselves pure and quickly retrieved themselves on the occasions when they crossed the line.',
      },
      {
        id: 'puritan',
        label: 'Sexual Puritan',
        description: 'This describes someone who may have had sexual intercourse or participated in other sexual immoralities before, but it was a grave mistake they regretted and did not plan to continue. They quickly retrieved themselves and have not returned to that life because of their belief in purity. It may also describe someone who was sexually active for a fairly long time in the past but, for a period of at least two to three years before now, has kept themselves pure—not for lack of opportunity, but because of a renewed understanding of the goodness of purity and a renewed commitment to it. The more years of deliberate abstinence, the more firmly established the person’s status as a Sexual Puritan becomes.',
      },
    ],
    abstinenceBands: ['0–2 years', '2–3 years', '3–4 years', '4–5 years', '5 years and above'],
    commitments: [
      'I am committed to abstinence and a lifestyle of sexual purity.',
      'I will respect confidentiality and not expose another member’s story.',
      'I understand that an administrator will review this application.',
    ],
  },
  comm2: {
    title: 'Recovery circle application',
    reviewTime: 'Usually reviewed within 1–2 days',
    privacyNote: 'Your recovery information is private and visible only to authorised community reviewers.',
    commitments: [
      'I am actively pursuing recovery and willing to respect the safety of others.',
      'I will keep member stories confidential.',
      'I understand that this community supports recovery but does not replace professional care.',
    ],
  },
  comm3: {
    title: 'Marriage healing application',
    reviewTime: 'Usually reviewed within 2–3 days',
    privacyNote: 'Personal relationship details are private and visible only to authorised reviewers.',
    commitments: [
      'I am married and genuinely seeking healing or restoration.',
      'I will not publicly shame my spouse or expose private details about other members.',
      'I will participate with honesty, respect, and a willingness to grow.',
    ],
  },
  comm4: {
    title: 'Marriage preparation application',
    reviewTime: 'Usually reviewed within 2–3 days',
    commitments: [
      'I am engaged or have a clear plan to marry within six months.',
      'I am open to accountable preparation and wise counsel.',
      'I will participate respectfully and protect member confidentiality.',
    ],
  },
  comm5: {
    title: 'Courtship circle application',
    reviewTime: 'Usually reviewed within 2–3 days',
    commitments: [
      'I am currently in a defined courtship relationship.',
      'I am open to mentorship, accountability, and honest reflection.',
      'I will respect my partner and the privacy of other members.',
    ],
  },
  comm6: {
    title: 'Leadership access request',
    reviewTime: 'Invitation and leadership approval are required',
    commitments: [
      'I currently serve in an approved leadership responsibility.',
      'I understand that access is invitation-only.',
      'I will protect confidential leadership discussions.',
    ],
  },
  comm7: {
    title: 'Whole singles application',
    reviewTime: 'Usually reviewed within 1–2 days',
    commitments: [
      'I am single and committed to purposeful Christian growth.',
      'I will participate respectfully without pressuring members for romantic attention.',
      'I will protect member confidentiality.',
    ],
  },
};

export const getCommunityRequirement = communityId => communityRequirements[communityId];
