/**
 * GitHub API Utility
 * 
 * Fetches recent activity (commits and closed issues) from GitHub repositories.
 * Uses Next.js fetch with caching (revalidate: 3600 seconds).
 * Requires a GITHUB_TOKEN for higher rate limits.
 */

export interface GitHubCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  url: string;
  closedAt: string;
}

/**
 * Extracts owner and repo from a GitHub URL (e.g. https://github.com/spark901/volunteer-scheduler)
 */
function parseGitHubUrl(url: string) {
  try {
    const parts = url.replace(/\/$/, "").split("/");
    return {
      owner: parts[parts.length - 2],
      repo: parts[parts.length - 1],
    };
  } catch (e) {
    return null;
  }
}

/**
 * Fetches recent commits for a given repository.
 */
export async function fetchRecentCommits(githubUrl: string, limit = 5): Promise<GitHubCommit[]> {
  const repoInfo = parseGitHubUrl(githubUrl);
  if (!repoInfo) return [];

  const { owner, repo } = repoInfo;
  const token = process.env.GITHUB_TOKEN;

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${limit}`,
      {
        headers: token ? { Authorization: `token ${token}` } : {},
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      console.error(`GitHub API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    return data.map((item: any) => ({
      sha: item.sha.substring(0, 7),
      message: item.commit.message.split("\n")[0],
      author: item.commit.author.name,
      date: item.commit.author.date,
      url: item.html_url,
    }));
  } catch (error) {
    console.error("Error fetching commits:", error);
    return [];
  }
}

/**
 * Fetches recently closed issues for a given repository.
 */
export async function fetchRecentResolvedIssues(githubUrl: string, limit = 5): Promise<GitHubIssue[]> {
  const repoInfo = parseGitHubUrl(githubUrl);
  if (!repoInfo) return [];

  const { owner, repo } = repoInfo;
  const token = process.env.GITHUB_TOKEN;

  try {
    // state=closed returns closed issues (which usually means resolved in open source)
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues?state=closed&per_page=${limit}&sort=updated`,
      {
        headers: token ? { Authorization: `token ${token}` } : {},
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      console.error(`GitHub API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    // Filter out pull requests as they are returned in the issues API
    return data
      .filter((item: any) => !item.pull_request)
      .map((item: any) => ({
        id: item.id,
        number: item.number,
        title: item.title,
        url: item.html_url,
        closedAt: item.closed_at,
      }));
  } catch (error) {
    console.error("Error fetching resolved issues:", error);
    return [];
  }
}
