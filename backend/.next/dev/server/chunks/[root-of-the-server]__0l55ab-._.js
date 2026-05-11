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
"[project]/OneDrive - NUST/Documents/GitHub/Digital-Language-Repository/backend/src/lib/supabase.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "supabase",
    ()=>supabase
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive__$2d$__NUST$2f$Documents$2f$GitHub$2f$Digital$2d$Language$2d$Repository$2f$backend$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/OneDrive - NUST/Documents/GitHub/Digital-Language-Repository/backend/node_modules/@supabase/supabase-js/dist/index.mjs [app-route] (ecmascript) <locals>");
;
const supabaseUrl = ("TURBOPACK compile-time value", "https://ayosltlzhwuyrwzujlid.supabase.co");
const supabaseKey = ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5b3NsdGx6aHd1eXJ3enVqbGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMjcxNDYsImV4cCI6MjA5MjcwMzE0Nn0.nOn6Qx0-OU-BOGUzzW2H0p7GI3aUUx-Di9V9ijtEOSY");
const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive__$2d$__NUST$2f$Documents$2f$GitHub$2f$Digital$2d$Language$2d$Repository$2f$backend$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, supabaseKey);
}),
"[project]/OneDrive - NUST/Documents/GitHub/Digital-Language-Repository/backend/src/app/api/tags/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive__$2d$__NUST$2f$Documents$2f$GitHub$2f$Digital$2d$Language$2d$Repository$2f$backend$2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive - NUST/Documents/GitHub/Digital-Language-Repository/backend/src/lib/supabase.ts [app-route] (ecmascript)");
;
async function GET(request) {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    let query = __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive__$2d$__NUST$2f$Documents$2f$GitHub$2f$Digital$2d$Language$2d$Repository$2f$backend$2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from('tags').select('*').order('name', {
        ascending: true
    });
    if (category) {
        query = query.eq('category', category);
    }
    if (search) {
        query = query.ilike('name', `%${search}%`);
    }
    const { data, error } = await query;
    if (error) {
        return Response.json({
            error: error.message
        }, {
            status: 500
        });
    }
    return Response.json({
        data
    });
}
async function POST(request) {
    try {
        const body = await request.json();
        const { name, slug, category, description } = body;
        if (!name || !slug) {
            return Response.json({
                error: 'name and slug are required'
            }, {
                status: 400
            });
        }
        const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive__$2d$__NUST$2f$Documents$2f$GitHub$2f$Digital$2d$Language$2d$Repository$2f$backend$2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabase"].from('tags').insert({
            name,
            slug,
            category,
            description
        }).select().single();
        if (error) {
            return Response.json({
                error: error.message
            }, {
                status: 500
            });
        }
        return Response.json({
            message: 'Tag created successfully',
            data
        });
    } catch  {
        return Response.json({
            error: 'Invalid request body'
        }, {
            status: 400
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0l55ab-._.js.map