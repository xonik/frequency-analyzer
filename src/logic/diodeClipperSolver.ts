import { Point } from "./types";

export const a = 'get out of here!'
const { exp } = Math;

/*
               ,------|<------,
               |              |
   ,--[ Rg ] --+----[ Rf ]----+
   |           |   ,______    |
  ---          `---| neg  \   |
                   |       \---+-- Output
        Input -----| pos   /
                   |______/

Yes, That's supposed to be an op amp. I am not entirely sure about
the orientation of the diode but I think this would be correct.


From ChatGPT:
Basic equation: Vout = (1+Rf/Rg) - Rf*Id

Where Id is the current through the diode.

Id is approximately I0* d^(Vd/(n*Vt)), (Shockley equation) where
I0 = Is = reverse-bias saturation current (or scale current), varies between diodes. Germanium is around 1, 1N4148 is around 1.9
     NB: Is strongly temperature dependent. As a rule of thumb, it doubles with every 10deg change!
n  = approximately 1.9 for silicone diodes (emission coefficient, quality factor, ideality factor, material constant...)
Vt = 25mV at room temperature (thermal voltage)
Vd = Vout - Vneg (because Rf and Rg act as a voltage divider)

Vt = kT/Q
k = Boltzmann constant
T = absolute temperature of the p-n junciton
q = elementary charge

Values for 1N4148 from https://electronics.stackexchange.com/questions/463376/how-to-model-a-real-diode-1n4148
Is = 4.35nA
n = 1.906

https://www.ece.mcgill.ca/~grober4/SPICE/SPICE_Decks/1st_Edition_LTSPICE/chapter3/Chapter%203%20Diodes%20web%20version.html
 */

export function solveForX(y: number, params: ClipperParams, tol = 1e-6, maxIter = 100, ) {

    const { I0, Vt, n, Rf, Rg } = params
    const g = (1 + Rf / Rg)
    const T = Vt * n;
    const k = Rf * I0;

    let x = y / g; // Initial guess

    for (let i = 0; i < maxIter; i++) {
        let f_x = g * x - k * exp((y - x) / T) - y;
        let df_x = g + (k / T) * exp((y - x) / T); // Derivative

        let x_new = x - f_x / df_x;

        if (Math.abs(x_new - x) < tol) {
            return x_new;
        }
        x = x_new;
    }
    console.log(`Solution did not converge for y=${y}`);
    return 0
}

// Works but doesn't converge on top for some reason. Not sure why.
function solveForY(x: number, params: ClipperParams, tol = 1e-6, maxIter = 100): number {

    const { I0, Vt, n, Rf, Rg } = params
    const g = (1 + Rf / Rg)
    const T = Vt * n;
    const k = Rf * I0;

    let y = g * x; // Initial guess

    for (let i = 0; i < maxIter; i++) {
        let f_y = g * x - k * Math.exp((y - x) / T) - y;
        let df_y = -(k / T) * Math.exp((y - x) / T) - 1;

        let y_new = y - f_y / df_y;

        if (Math.abs(y_new - y) < tol) {
            return y_new;
        }

        y = y_new;
    }

    console.log(`Solution did not converge for x=${x}`);
    return 0;
}

/*
function testForXY(x: number, y: number) {
    return g * x - k * Math.exp((y - x) / T)
}
 */

export function generateList(v1: number, v2: number, interval: number) {
    const values: number[] = []
    let v = v1;
    while (v < v2) {
        values.push(v)
        v += interval;
    }
    values.push(v2)
    return values
}

export function solveDiodeClipperForYRange(y0: number, y1: number, interval: number, params: ClipperParams) {
    const yValues = generateList(y0, y1, interval)

    const points = yValues.map((y) => ({
        x: solveForX(y, params),
        y,
    }))

    return points
}

export function solveDiodeClipperForXRange(x0: number, x1: number, interval: number, params: ClipperParams) {
    const xValues = generateList(x0, x1, interval)

    const points = xValues.map((x) => ({
        x,
        y: solveForY(x, params),
    }))

    return points
}

export function solveOpAmpGainForX(points: Point[]) {
/*
    const opAmpPoints = points.map(({ x }) => ({
        x,
        y: x * g,
    }))

    return opAmpPoints*/
}

export function findDeviationFromLinear(points: Point[], linearGain: number) {
    return points.map((point) => {
        const yLinear = point.x * linearGain
        const yDiff = yLinear - point.y
        const yDiffPercent = yLinear === 0 ? 0 : yDiff * 100 / yLinear
        return {
            ...point,
            yLinear,
            yDiff,
            yDiffPercent,
        }
    })
}

type ClipperParams = {
    I0: number
    Vt: number
    n: number
    Rg: number,
    Rf: number,
}