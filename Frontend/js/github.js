// ====================
// GitHub
// ====================

async function loadGitHub() {

    const username = "jtw011";

    try {

        // Get profile
        const profileResponse =
            await fetch(
                `https://api.github.com/users/${username}`
            );

        if (!profileResponse.ok) {
            throw new Error(
                "GitHub profile request failed"
            );
        }

        const profile =
            await profileResponse.json();

        // Get recently pushed repositories
        const reposResponse =
            await fetch(
                `https://api.github.com/users/${username}/repos?sort=pushed&direction=desc&per_page=5`
            );

        if (!reposResponse.ok) {
            throw new Error(
                "GitHub repositories request failed"
            );
        }

        const repos =
            await reposResponse.json();

        // Get latest commit for each repository
        const commits = await Promise.all(

            repos.map(async repo => {

                const commitResponse =
                    await fetch(
                        `https://api.github.com/repos/${username}/${repo.name}/commits?per_page=1`
                    );

                if (!commitResponse.ok) {
                    return null;
                }

                const commitData =
                    await commitResponse.json();

                if (!commitData.length) {
                    return null;
                }

                return {
                    repo: repo.name,
                    message:
                        commitData[0].commit.message
                            .split("\n")[0],
                    date:
                        commitData[0].commit.author.date
                };
            })
        );

        const validCommits =
            commits.filter(
                commit => commit !== null
            );

        const githubElement =
            document.getElementById("github-content");

        if (!githubElement) return;

        githubElement.innerHTML = `
            <div class="github-layout">

                <div class="github-stat">

                    <strong>
                        ${profile.public_repos}
                    </strong>

                    <span>
                        Repositories
                    </span>

                </div>

                <div class="github-repos">

                    <h3>
                        Latest Pushes
                    </h3>

                    ${validCommits
                        .slice(0, 2)
                        .map(commit => `

                            <div class="github-repo">

                                <strong>
                                    ${commit.repo}
                                </strong>

                                <span>
                                    ${commit.message}
                                </span>

                                <small>
                                    ${formatGitHubDate(commit.date)}
                                </small>

                            </div>

                        `)
                        .join("")}

                </div>

            </div>
        `;

    } catch (error) {

        console.error("GitHub error:", error);

        const githubElement =
            document.getElementById("github-content");

        if (githubElement) {

            githubElement.textContent =
                "Unable to load GitHub data.";
        }
    }
}


function formatGitHubDate(dateString) {

    const date =
        new Date(dateString);

    return date.toLocaleDateString(
        undefined,
        {
            month: "short",
            day: "numeric"
        }
    );
}

loadGitHub();
