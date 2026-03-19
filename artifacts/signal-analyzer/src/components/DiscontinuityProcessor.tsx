import { SignalLine } from './SignalChart';

export interface ProcessedData {
    data: any[];
    lines: SignalLine[];
}

export function processContinuousData(data: any[], lines: SignalLine[], xKey: string = 't', extendToInfinity: boolean = false, threshold = 1e-8): ProcessedData {
    let processedData = [...data];
    const processedLines = [...lines];

    // If extendToInfinity is enabled, extend original signal with 0 + endpoint drops only
    if (extendToInfinity && data.length > 0) {
        const minX = data[0][xKey];
        const maxX = data[data.length - 1][xKey];
        const range = maxX - minX;
        const extendDistance = range * 2;
        const epsilon = range * 1e-6;

        // Left: conditional drop + extend
        const firstPoint = data[0];
        const needsLeftDrop = lines.some(line => Math.abs(firstPoint[line.key] - 0) > 1e-8);
        if (needsLeftDrop) {
            const leftZero = { [xKey]: minX - epsilon };
            lines.forEach(line => leftZero[line.key] = 0);
            processedData.unshift(leftZero);
        }

        const leftExtend = { [xKey]: minX - extendDistance };
        lines.forEach(line => leftExtend[line.key] = 0);
        processedData.unshift(leftExtend);

        // Right: conditional drop + extend
        const lastPoint = data[data.length - 1];
        const needsRightDrop = lines.some(line => Math.abs(lastPoint[line.key] - 0) > 1e-8);
        if (needsRightDrop) {
            const rightZero = { [xKey]: maxX + epsilon };
            lines.forEach(line => rightZero[line.key] = 0);
            processedData.push(rightZero);
        }

        const rightExtend = { [xKey]: maxX + extendDistance };
        lines.forEach(line => rightExtend[line.key] = 0);
        processedData.push(rightExtend);

        // Keep original signal 100% unchanged + clean extension
    }

    // Only detect REAL discontinuities (higher threshold for true jumps)
    const epsilon = (processedData[processedData.length - 1][xKey] - processedData[0][xKey]) * 1e-6;
    const realDiscontinuityThreshold = 0.5; // Higher threshold for true jumps only

    for (let i = 0; i < processedData.length - 1; i++) {
        const curr = processedData[i];
        const next = processedData[i + 1];
        const currX = curr[xKey];
        const nextX = next[xKey];
        const dx = nextX - currX;

        // Check each line key for REAL discontinuity
        let hasRealDiscontinuity = false;
        for (const line of lines) {
            const currY = curr[line.key];
            const nextY = next[line.key];
            if (Math.abs(currY - nextY) > realDiscontinuityThreshold) {
                hasRealDiscontinuity = true;
                break;
            }
        }

        if (hasRealDiscontinuity && dx > epsilon * 10) {
            // Insert points to create vertical jump
            const midX = currX + dx * 0.5;

            // Point just before jump (same y as current)
            const preJump = { ...curr };
            preJump[xKey] = midX - epsilon;

            // Point just after jump (same y as next)
            const postJump = { ...next };
            postJump[xKey] = midX + epsilon;

            // Insert into processed data
            processedData.splice(i + 1, 0, preJump, postJump);

            // Update i to skip inserted points
            i += 2;
        }
    }

    return { data: processedData, lines: processedLines };
}

