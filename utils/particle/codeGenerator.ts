/**
 * Code Generator for Particle Expression System
 * 
 * Compiles expression definitions into executable JavaScript functions
 */

import {
    ParticleExpressionSystem,
    CompiledParticleSystem,
    CompiledVariable,
    CompiledParticleOutput,
    ParticleExpressionError
} from '../../types/particle';
import { buildDependencyGraph, validateOutput } from './expressionParser';

// ============================================
// Compilation Cache
// ============================================

const compilationCache = new WeakMap<ParticleExpressionSystem, CompiledParticleSystem>();

// ============================================
// Function Compilation
// ============================================

/**
 * Compile a single expression into a function
 * The function receives (n, t, vars) where vars contains computed variable values
 */
function compileExpression(
    expression: string,
    variableNames: string[]
): (n: number, t: number, vars: Record<string, number>) => number {
    // Build variable access code
    // Convert variable references to vars.variableName
    let processedExpr = expression;

    // Sort by length (descending) to avoid partial replacements
    const sortedVars = [...variableNames].sort((a, b) => b.length - a.length);

    for (const varName of sortedVars) {
        // Use word boundary to avoid replacing parts of other identifiers
        const regex = new RegExp(`\\b${varName}\\b`, 'g');
        processedExpr = processedExpr.replace(regex, `vars.${varName}`);
    }

    try {
        // eslint-disable-next-line no-new-func
        const fn = new Function('n', 't', 'vars', `return ${processedExpr};`) as
            (n: number, t: number, vars: Record<string, number>) => number;

        // Test compilation
        const testResult = fn(1, 0, Object.fromEntries(variableNames.map(v => [v, 0])));
        if (typeof testResult !== 'number') {
            throw new Error('Expression did not return a number');
        }

        return fn;
    } catch (error) {
        throw new ParticleExpressionError(
            `Failed to compile expression: ${expression}`,
            'SYNTAX_ERROR',
            { expression, error: String(error) }
        );
    }
}

/**
 * Compile a color expression (can return string)
 */
function compileColorExpression(
    expression: string,
    variableNames: string[]
): ((n: number, t: number, vars: Record<string, number>) => string) | null {
    if (!expression) return null;

    let processedExpr = expression;
    const sortedVars = [...variableNames].sort((a, b) => b.length - a.length);

    for (const varName of sortedVars) {
        const regex = new RegExp(`\\b${varName}\\b`, 'g');
        processedExpr = processedExpr.replace(regex, `vars.${varName}`);
    }

    try {
        // eslint-disable-next-line no-new-func
        return new Function('n', 't', 'vars', `return ${processedExpr};`) as
            (n: number, t: number, vars: Record<string, number>) => string;
    } catch (error) {
        throw new ParticleExpressionError(
            `Failed to compile color expression: ${expression}`,
            'SYNTAX_ERROR',
            { expression, error: String(error) }
        );
    }
}

// ============================================
// Main Compilation
// ============================================

/**
 * Compile a particle expression system into an executable form
 */
export function compileParticleExpressionSystem(
    system: ParticleExpressionSystem
): CompiledParticleSystem {
    // Check cache
    const cached = compilationCache.get(system);
    if (cached) return cached;

    // Build dependency graph and get sorted order
    const graph = buildDependencyGraph(system.definitions);

    if (graph.hasCycle) {
        throw new ParticleExpressionError(
            `Circular dependency detected: ${graph.cycleInfo?.join(' → ')}`,
            'CIRCULAR_DEP',
            { cycle: graph.cycleInfo }
        );
    }

    // Validate output expressions
    validateOutput(system.output, system.definitions);

    // Compile variables in topological order
    const compiledVariables: CompiledVariable[] = [];
    const allVarNames = Object.keys(system.definitions);

    for (const varName of graph.sortedOrder) {
        const expression = system.definitions[varName];
        const node = graph.nodes.get(varName)!;

        compiledVariables.push({
            name: varName,
            fn: compileExpression(expression, allVarNames),
            dependencies: [...node.dependencies]
        });
    }

    // Compile output expressions
    const compiledOutput: CompiledParticleOutput = {
        x: compileExpression(system.output.x, allVarNames),
        y: compileExpression(system.output.y, allVarNames),
        alpha: system.output.alpha
            ? compileExpression(system.output.alpha, allVarNames)
            : (_n, _t, _vars) => 1,
        size: system.output.size
            ? compileExpression(system.output.size, allVarNames)
            : (_n, _t, _vars) => 1,
        color: compileColorExpression(system.output.color || '', allVarNames)
    };

    const result: CompiledParticleSystem = {
        variables: compiledVariables,
        output: compiledOutput,
        particleCount: system.particleCount ?? 4000,
        timeScale: system.timeScale ?? 0.0002,
        colorHex: system.colorHex ?? '#ffffff'
    };

    // Cache the result
    compilationCache.set(system, result);

    return result;
}

// ============================================
// Runtime Execution Helper
// ============================================

/**
 * Execute a compiled system for a single particle
 * Returns { x, y, alpha, size, color }
 */
export function executeParticle(
    system: CompiledParticleSystem,
    n: number,
    t: number
): { x: number; y: number; alpha: number; size: number; color: string } {
    const vars: Record<string, number> = {};

    // Compute variables in order
    for (const variable of system.variables) {
        vars[variable.name] = variable.fn(n, t, vars);
    }

    // Compute outputs
    return {
        x: system.output.x(n, t, vars),
        y: system.output.y(n, t, vars),
        alpha: system.output.alpha(n, t, vars),
        size: system.output.size(n, t, vars),
        color: system.output.color ? system.output.color(n, t, vars) : system.colorHex
    };
}
