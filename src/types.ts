export type Trend = {
  name: string;
  core: string;
  insight: string;
  source: string;
};

export type ResearchResult = {
  keyword: string;
  trends: Trend[];
};
