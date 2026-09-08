// ====================
// System Stats
// ====================

async function loadSystemStats() {

    try {

        const response =
            await fetch("http://localhost:3000/api/system-stats");

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        const stats = await response.json();

        console.log("System stats:", stats);

        const statsElement =
            document.getElementById("system-stats");

        if (!statsElement) return;

        statsElement.innerHTML = `
            <div class="stat">

                <div class="stat-header">
                    <span>CPU</span>
                    <strong>${stats.cpu}%</strong>
                </div>

                <div class="stat-bar">
                    <div
                        class="stat-fill"
                        style="width: ${stats.cpu}%">
                    </div>
                </div>

            </div>

            <div class="stat">

                <div class="stat-header">
                    <span>Memory</span>
                    <strong>${stats.memory}%</strong>
                </div>

                <div class="stat-bar">
                    <div
                        class="stat-fill"
                        style="width: ${stats.memory}%">
                    </div>
                </div>

            </div>

            <div class="stat">

                <div class="stat-header">
                    <span>Storage</span>

                    <strong>
                        ${stats.storage} GB /
                        ${stats.storageTotal} GB
                    </strong>
                </div>

                <div class="stat-bar">
                    <div
                        class="stat-fill"
                        style="
                            width:
                            ${(stats.storage / stats.storageTotal) * 100}%;
                        ">
                    </div>
                </div>

            </div>
        `;

    } catch (error) {

        console.error("System stats error:", error);

        const statsElement =
            document.getElementById("system-stats");

        if (statsElement) {

            statsElement.innerHTML = `
                <p>System stats unavailable</p>
            `;
        }
    }
}

loadSystemStats();

setInterval(loadSystemStats, 5000);
