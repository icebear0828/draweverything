/**
 * Expression Parser for Particle System
 * 
 * Extracts variable references from expressions and builds dependency graph
 */

import {
    DependencyNode,
    DependencyGraph,
    ParticleExpressionError
} from '../../types/particle';

// Built-in variables that don't need to be defined
const BUILTIN_VARS = new Set(['n', 't', 'Math', 'PI']);

// Built-in Math methods
const MATH_METHODS = new Set([
    'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
    'sqrt', 'pow', 'abs', 'floor', 'ceil', 'round',
    'min', 'max', 'exp', 'log', 'log10', 'log2',
    'sign', 'random'
]);

/**
 * Token types for simple lexer
 */
type TokenType = 'IDENTIFIER' | 'NUMBER' | 'OPERATOR' | 'PAREN' | 'DOT' | 'OTHER';

interface Token {
    type: TokenType;
    value: string;
    position: number;
}

/**
 * Simple tokenizer for expressions
 */
export function tokenize(expression: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < expression.length) {
        const char = expression[i];

        // Skip whitespace
        if (/\s/.test(char)) {
            i++;
            continue;
        }

        // Number (including decimals)
        if (/[0-9]/.test(char) || (char === '.' && /[0-9]/.test(expression[i + 1] || ''))) {
            let num = '';
            const start = i;
            while (i < expression.length && /[0-9.]/.test(expression[i])) {
                num += expression[i++];
            }
            tokens.push({ type: 'NUMBER', value: num, position: start });
            continue;
        }

        // Identifier (variable or function name)
        if (/[a-zA-Z_]/.test(char)) {
            let id = '';
            const start = i;
            while (i < expression.length && /[a-zA-Z0-9_]/.test(expression[i])) {
                id += expression[i++];
            }
            tokens.push({ type: 'IDENTIFIER', value: id, position: start });
            continue;
        }

        // Dot (for Math.sin, etc.)
        if (char === '.') {
            tokens.push({ type: 'DOT', value: '.', position: i });
            i++;
            continue;
        }

        // Parentheses
        if ('()'.includes(char)) {
            tokens.push({ type: 'PAREN', value: char, position: i });
            i++;
            continue;
        }

        // Operators
        if ('+-*/%^'.includes(char)) {
            tokens.push({ type: 'OPERATOR', value: char, position: i });
            i++;
            continue;
        }

        // Other (commas, brackets, etc.)
        tokens.push({ type: 'OTHER', value: char, position: i });
        i++;
    }

    return tokens;
}

/**
 * Extract variable references from an expression
 * Returns only user-defined variables (not builtins like n, t, Math)
 */
export function extractVariables(expression: string): Set<string> {
    const tokens = tokenize(expression);
    const variables = new Set<string>();

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token.type !== 'IDENTIFIER') continue;

        const name = token.value;

        // Skip Math object
        if (name === 'Math') continue;

        // Skip if it follows a dot (it's a method, like .sin)
        if (i > 0 && tokens[i - 1].type === 'DOT') continue;

        // Skip builtin variables
        if (BUILTIN_VARS.has(name)) continue;

        // Skip Math methods used standalone (shouldn't happen but just in case)
        if (MATH_METHODS.has(name)) continue;

        // This is a user variable reference
        variables.add(name);
    }

    return variables;
}

/**
 * Build dependency graph from definitions
 */
export function buildDependencyGraph(
    definitions: Record<string, string>
): DependencyGraph {
    const nodes = new Map<string, DependencyNode>();

    // Create nodes for each definition
    for (const [name, expression] of Object.entries(definitions)) {
        const dependencies = extractVariables(expression);
        nodes.set(name, {
            name,
            expression,
            dependencies
        });
    }

    // Validate: check for undefined variables
    const definedVars = new Set(Object.keys(definitions));
    for (const [name, node] of nodes) {
        for (const dep of node.dependencies) {
            if (!definedVars.has(dep)) {
                throw new ParticleExpressionError(
                    `Variable "${dep}" is referenced in "${name}" but not defined`,
                    'UNDEFINED_VAR',
                    { variable: dep, referencedIn: name }
                );
            }
        }
    }

    // Topological sort (Kahn's algorithm)
    const { sorted, hasCycle, cycleInfo } = topologicalSort(nodes);

    return {
        nodes,
        sortedOrder: sorted,
        hasCycle,
        cycleInfo
    };
}

/**
 * Topological sort using Kahn's algorithm
 */
function topologicalSort(
    nodes: Map<string, DependencyNode>
): { sorted: string[]; hasCycle: boolean; cycleInfo?: string[] } {
    // Calculate in-degree for each node
    const inDegree = new Map<string, number>();
    const dependents = new Map<string, Set<string>>();

    for (const name of nodes.keys()) {
        inDegree.set(name, 0);
        dependents.set(name, new Set());
    }

    for (const [name, node] of nodes) {
        for (const dep of node.dependencies) {
            if (nodes.has(dep)) {
                inDegree.set(name, (inDegree.get(name) || 0) + 1);
                dependents.get(dep)!.add(name);
            }
        }
    }

    // Start with nodes that have no dependencies
    const queue: string[] = [];
    for (const [name, degree] of inDegree) {
        if (degree === 0) {
            queue.push(name);
        }
    }

    const sorted: string[] = [];

    while (queue.length > 0) {
        const current = queue.shift()!;
        sorted.push(current);

        // Reduce in-degree for dependents
        for (const dependent of dependents.get(current) || []) {
            const newDegree = (inDegree.get(dependent) || 1) - 1;
            inDegree.set(dependent, newDegree);
            if (newDegree === 0) {
                queue.push(dependent);
            }
        }
    }

    // Check for cycle
    if (sorted.length !== nodes.size) {
        // Find nodes in cycle
        const cycleNodes = [...nodes.keys()].filter(n => !sorted.includes(n));
        return {
            sorted,
            hasCycle: true,
            cycleInfo: cycleNodes
        };
    }

    return { sorted, hasCycle: false };
}

/**
 * Validate output expressions
 */
export function validateOutput(
    output: { x: string; y: string; alpha?: string; size?: string; color?: string },
    definitions: Record<string, string>
): void {
    const definedVars = new Set(Object.keys(definitions));

    const outputs = [
        { name: 'x', expr: output.x },
        { name: 'y', expr: output.y },
        { name: 'alpha', expr: output.alpha },
        { name: 'size', expr: output.size },
        { name: 'color', expr: output.color },
    ];

    for (const { name, expr } of outputs) {
        if (!expr) continue;

        const refs = extractVariables(expr);
        for (const ref of refs) {
            if (!definedVars.has(ref)) {
                throw new ParticleExpressionError(
                    `Variable "${ref}" in output.${name} is not defined`,
                    'UNDEFINED_VAR',
                    { variable: ref, referencedIn: `output.${name}` }
                );
            }
        }
    }
}
