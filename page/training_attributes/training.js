import kNear from "./knear.js"

const k = 3
 export const machine = new kNear(k);



export function flattenAndLabelData(arr, label) {
    let flattened = [];

    arr.forEach(obj => {
        flattened.push(obj.x, obj.y, obj.z);
    });

    return { pose: flattened, label: label };
}

export function flattenArray(arr) {

    let flattened = [];
    
    arr.forEach(obj => {
        flattened.push(obj.x, obj.y, obj.z);
    });
    
    return flattened;
}

// Output: { pose: [0.1, 0.3, 0.6, 0.2, 0.7, 0.9], label: "rock" }
