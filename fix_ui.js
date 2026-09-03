const fs = require("fs");
let text = fs.readFileSync("src/app/page.js", "utf8");

// Remove the quick connect bar and replace with Setup message
const connectBarStart = "{/* If no sheet connected yet -> Quick 1-line connection bar */}";
const isTodayWeekendStr = "{/* If Today is Saturday or Sunday -> Weekend Screen */}";

const replacement = `        {/* Connection Status Handling */}
        {!isConnected && (
          <div className="glass-panel" style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "16px 20px", marginBottom: "20px", color: "var(--text-secondary)" }}>
            {isLoading || isConnecting ? (
              <>
                <Loader2 size={18} className="animate-spin" style={{ marginRight: "10px" }} />
                <span>Loading application data...</span>
              </>
            ) : (
              <>
                <AlertCircle size={18} style={{ marginRight: "10px", color: "#ef4444" }} />
                <span>Setup is not done or connection failed. Please visit your <a href="/admin" style={{ color: "var(--primary)", textDecoration: "underline" }}>Admin Dashboard</a> for this issue.</span>
              </>
            )}
          </div>
        )}

        `;

// Replace the block
text = text.substring(0, text.indexOf(connectBarStart)) + replacement + text.substring(text.indexOf(isTodayWeekendStr));

// Fix empty students message
text = text.replace(
  "<span>No students found. Please connect your Google Sheet.</span>",
  "<span>No students found. Ensure setup is completed in the Admin panel.</span>"
);

fs.writeFileSync("src/app/page.js", text, "utf8");
console.log("Updated page.js UI");
