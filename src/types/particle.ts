/**
 * Particle Expression System Types
 * 
 * Supports:
 * - Named variable definitions
 * - Dependency resolution
 * - Multi-system composition
 * - Preset inheritance
 */

// ============================================
// Core Expression Types
// ============================================

/**
 * Output configuration for particle rendering
 */
export interface ParticleOutput {
    /** X coordinate formula (can reference definitions) */
    x: string;
    /** Y coordinate formula (can reference definitions) */
    y: string;
    /** Alpha/opacity formula (0-1), optional */
    alpha?: string;
    /** Particle size formula, optional */
    size?: string;
    /** Dynamic color formula (hex or hsl), optional */
    color?: string;
}

/**
 * Single particle system definition with named variables
 */
export interface ParticleExpressionSystem {
    /** Named variable definitions (order-independent, resolved by dependency) */
    definitions: Record<string, string>;
    /** Output formulas (x, y, alpha, etc.) */
    output: ParticleOutput;
    /** Number of particles (default: 4000) */
    particleCount?: number;
    /** Time step multiplier (default: 0.0002) */
    timeScale?: number;
    /** Base color when output.color is not specified */
    colorHex?: string;
}

/**
 * Complete preset supporting multiple systems
 */
export interface ParticlePreset {
    /** Display label */
    label: string;
    /** Array of particle systems (rendered in order) */
    systems: ParticleExpressionSystem[];
    /** Inherit from another preset key */
    extends?: string;
    /** Blend mode for multiple systems */
    blendMode?: 'additive' | 'normal';
    /** Background color */
    backgroundColor?: string;
}

// ============================================
// Compiled Types (for runtime)
// ============================================

/**
 * Compiled output functions
 */
export interface CompiledParticleOutput {
    x: (n: number, t: number, vars: Record<string, number>) => number;
    y: (n: number, t: number, vars: Record<string, number>) => number;
    alpha: (n: number, t: number, vars: Record<string, number>) => number;
    size: (n: number, t: number, vars: Record<string, number>) => number;
    color: ((n: number, t: number, vars: Record<string, number>) => string) | null;
}

/**
 * Compiled variable with its dependencies resolved
 */
export interface CompiledVariable {
    name: string;
    fn: (n: number, t: number, vars: Record<string, number>) => number;
    dependencies: string[];
    hasLoops?: boolean;
    loopJsCode?: string;
}

/**
 * Fully compiled particle system ready for execution
 */
export interface CompiledParticleSystem {
    /** Ordered list of variables (topologically sorted) */
    variables: CompiledVariable[];
    /** Compiled output functions */
    output: CompiledParticleOutput;
    /** Runtime settings */
    particleCount: number;
    timeScale: number;
    colorHex: string;
}

/**
 * Compiled preset with all systems ready
 */
export interface CompiledParticlePreset {
    label: string;
    systems: CompiledParticleSystem[];
    blendMode: 'additive' | 'normal';
    backgroundColor: string;
}

// ============================================
// Dependency Graph Types
// ============================================

/**
 * Node in the dependency graph
 */
export interface DependencyNode {
    name: string;
    expression: string;
    dependencies: Set<string>;
}

/**
 * Result of dependency analysis
 */
export interface DependencyGraph {
    nodes: Map<string, DependencyNode>;
    sortedOrder: string[];
    hasCycle: boolean;
    cycleInfo?: string[];
}

// ============================================
// Loop Types
// ============================================

/**
 * Configuration for loop safety limits
 */
export interface LoopConfig {
    maxIterations: number;
    maxNestingDepth: number;
    maxBodyLength: number;
    maxTotalIterations: number;
}

/**
 * Parsed loop structure
 */
export interface ParsedLoop {
    type: 'sum' | 'prod';
    iterator: string;
    start: string;
    end: string;
    step: string | null;
    body: string;
    position: { start: number; end: number };
}

/**
 * Result of loop parsing
 */
export interface LoopParseResult {
    hasLoops: boolean;
    loops: ParsedLoop[];
    transformedExpr: string;
}

/**
 * Result of loop validation
 */
export interface LoopValidationResult {
    valid: boolean;
    error?: string;
    warnings?: string[];
}

/**
 * Compiled loop with executor and JS code for export
 */
export interface CompiledLoop {
    executor: (n: number, t: number, vars: Record<string, number>) => number;
    jsCode: string;
}

// ============================================
// Error Types
// ============================================

export class ParticleExpressionError extends Error {
    constructor(
        message: string,
        public readonly code: 'UNDEFINED_VAR' | 'CIRCULAR_DEP' | 'SYNTAX_ERROR' | 'RUNTIME_ERROR' | 'LOOP_ERROR',
        public readonly details?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'ParticleExpressionError';
    }
}
