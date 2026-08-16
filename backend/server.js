const http = require("http");
const si = require("systeminformation");

const PORT = 3000;

const server = http.createServer(async (req, res) => {

    // Allow requests from the Dash frontend
    res.setHeader("Access-Control-Allow-Origin", "*");

    // System stats endpoint
    if (req.url === "/api/system-stats") {

        try {
            const cpu = await si.currentLoad();
            const memory = await si.mem();
            const disk = await si.fsSize();

    const stats = {
        cpu: Math.round(cpu.currentLoad),
        memory: Math.round((memory.used / memory.total) * 100),
        storage: Math.round(disk[0].used / 1024 / 1024 / 1024),
        storageTotal: Math.round(disk[0].size / 1024 / 1024 / 1024)
};

            res.writeHead(200, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify(stats));

        } catch (error) {
            console.error(error);

            res.writeHead(500, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify({
                error: "Unable to get system stats"
            }));
        }

        return;
    }

    res.writeHead(404, {
        "Content-Type": "text/plain"
    });

    res.end("Not Found");
});

server.listen(PORT, () => {
    console.log(`Dash backend running at http://localhost:${PORT}`);
});
