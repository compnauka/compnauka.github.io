(function (global) {
    const SHARE_VERSION = 1;
    const HASH_PREFIX = "#r=";

    function clampNumber(value, min, max) {
        const number = Number(value);
        if (!Number.isFinite(number)) {
            return min;
        }

        return Math.max(min, Math.min(max, number));
    }

    function sanitizeConceptSummary(conceptSummary) {
        const stats = Array.isArray(conceptSummary && conceptSummary.stats)
            ? conceptSummary.stats
                .filter(item => item && typeof item.concept === "string")
                .map(item => {
                    const total = clampNumber(item.total, 0, 99);
                    const correct = clampNumber(item.correct, 0, total);
                    const conceptRoot = typeof item.conceptRoot === "string" ? item.conceptRoot.trim() : "";
                    const conceptKeys = Array.isArray(item.conceptKeys)
                        ? item.conceptKeys
                            .filter(key => typeof key === "string" && key.trim())
                            .map(key => key.trim())
                        : [];
                    return {
                        concept: item.concept.trim(),
                        total,
                        correct,
                        conceptRoot,
                        conceptKeys
                    };
                })
            : [];

        return {
            all: stats.map(item => item.concept),
            mastered: stats.filter(item => item.correct === item.total).map(item => item.concept),
            needsPractice: stats.filter(item => item.correct < item.total).map(item => item.concept),
            stats
        };
    }

    function sanitizeDiagnosticProfile(diagnosticProfile) {
        const profile = diagnosticProfile && typeof diagnosticProfile === "object" ? diagnosticProfile : {};

        return {
            strongKnowledge: clampNumber(profile.strongKnowledge, 0, 99),
            emergingKnowledge: clampNumber(profile.emergingKnowledge, 0, 99),
            tentativeKnowledge: clampNumber(profile.tentativeKnowledge, 0, 99),
            falseConfidence: clampNumber(profile.falseConfidence, 0, 99),
            uncertainError: clampNumber(profile.uncertainError, 0, 99),
            explicitUnknown: clampNumber(profile.explicitUnknown, 0, 99),
            skipped: clampNumber(profile.skipped, 0, 99),
            tooFastAttempts: clampNumber(profile.tooFastAttempts, 0, 99)
        };
    }

    function buildSharePayload(state, conceptSummary, totalQuestions, scoreOverride, diagnosticProfile) {
        const safeTotal = clampNumber(totalQuestions, 1, 99);
        const scoreSource = Number.isFinite(Number(scoreOverride))
            ? scoreOverride
            : state && state.score;
        const safeScore = clampNumber(scoreSource, 0, safeTotal);
        const safeGrade = String((state && state.currentGrade) || "").trim();

        return {
            v: SHARE_VERSION,
            grade: safeGrade,
            score: safeScore,
            total: safeTotal,
            sharedAt: new Date().toISOString(),
            conceptSummary: sanitizeConceptSummary(conceptSummary),
            diagnosticProfile: sanitizeDiagnosticProfile(diagnosticProfile)
        };
    }

    function encodeSharePayload(payload) {
        return encodeURIComponent(JSON.stringify(payload));
    }

    function decodeSharePayload(encodedPayload) {
        if (!encodedPayload || typeof encodedPayload !== "string") {
            return null;
        }

        try {
            const parsed = JSON.parse(decodeURIComponent(encodedPayload));
            if (!parsed || parsed.v !== SHARE_VERSION) {
                return null;
            }

            const total = clampNumber(parsed.total, 1, 99);
            const score = clampNumber(parsed.score, 0, total);

            return {
                v: SHARE_VERSION,
                grade: String(parsed.grade || ""),
                score,
                total,
                sharedAt: typeof parsed.sharedAt === "string" ? parsed.sharedAt : "",
                conceptSummary: sanitizeConceptSummary(parsed.conceptSummary || { stats: [] }),
                diagnosticProfile: sanitizeDiagnosticProfile(parsed.diagnosticProfile)
            };
        } catch (error) {
            return null;
        }
    }

    function getEncodedPayloadFromHash(hashValue) {
        const hash = String(hashValue || "");
        if (!hash.startsWith(HASH_PREFIX)) {
            return null;
        }

        return hash.slice(HASH_PREFIX.length).trim() || null;
    }

    function buildShareUrl(locationObject, payload) {
        const encoded = encodeSharePayload(payload);
        const origin = locationObject && typeof locationObject.origin === "string" ? locationObject.origin : "";
        const pathname = locationObject && typeof locationObject.pathname === "string" ? locationObject.pathname : "";
        const baseUrl = origin && origin !== "null" ? `${origin}${pathname}` : pathname;
        return `${baseUrl}${HASH_PREFIX}${encoded}`;
    }

    const ResultShare = {
        SHARE_VERSION,
        HASH_PREFIX,
        buildSharePayload,
        encodeSharePayload,
        decodeSharePayload,
        getEncodedPayloadFromHash,
        buildShareUrl,
        sanitizeConceptSummary,
        sanitizeDiagnosticProfile
    };

    global.ResultShare = ResultShare;

    if (typeof module !== "undefined" && module.exports) {
        module.exports = ResultShare;
    }
})(typeof window !== "undefined" ? window : globalThis);
