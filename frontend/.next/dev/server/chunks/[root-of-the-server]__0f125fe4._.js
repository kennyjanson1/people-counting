module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/OneDrive - Bina Nusantara/Sem 5/Deep Learning/DL_Projects/frontend/app/api/stream/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Server-Sent Events untuk real-time updates
__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive__$2d$__Bina__Nusantara$2f$Sem__5$2f$Deep__Learning$2f$DL_Projects$2f$frontend$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive - Bina Nusantara/Sem 5/Deep Learning/DL_Projects/frontend/node_modules/next/server.js [app-route] (ecmascript)");
;
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";
async function GET(req) {
    const encoder = new TextEncoder();
    const customReadable = new ReadableStream({
        async start (controller) {
            try {
                const response = await fetch(`${BACKEND_URL}/api/stream`);
                if (!response.ok) throw new Error("Stream connection failed");
                const reader = response.body?.getReader();
                if (!reader) throw new Error("No response body");
                while(true){
                    const { done, value } = await reader.read();
                    if (done) break;
                    // Transform backend format ke frontend format
                    const text = new TextDecoder().decode(value);
                    const lines = text.split("\n");
                    for (const line of lines){
                        if (line.startsWith("data: ")) {
                            try {
                                const data = JSON.parse(line.substring(6));
                                const transformed = `data: ${JSON.stringify({
                                    maleIn: data.male_in,
                                    maleOut: data.male_out,
                                    femaleIn: data.female_in,
                                    femaleOut: data.female_out,
                                    currentCount: data.current_count,
                                    fps: data.fps || 0,
                                    timestamp: Date.now()
                                })}\n\n`;
                                controller.enqueue(encoder.encode(transformed));
                            } catch (e) {
                            // Ignore parse errors
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("[v0] Stream error:", error);
                controller.error(error);
            } finally{
                controller.close();
            }
        }
    });
    return new __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive__$2d$__Bina__Nusantara$2f$Sem__5$2f$Deep__Learning$2f$DL_Projects$2f$frontend$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"](customReadable, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive"
        }
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0f125fe4._.js.map