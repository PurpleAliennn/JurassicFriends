import kNear from "./knear.js"

const k = 3
 export const machine = new kNear(k);

//machine.learn([18, 9.2, 8.1, 2], 'cat')

export function flattenAndLabelData(arr, label) {
    let flattened = [];

    arr.forEach(obj => {
        flattened.push(obj.x, obj.y, obj.z);
    });

    return { pose: flattened, label: label };
}

export function flattenArray(arr) {
    // Initialize an empty array to hold the flattened values
    let flattened = [];
    
    // Loop through each object in the input array
    arr.forEach(obj => {
        // For each object, push its values into the flattened array
        flattened.push(obj.x, obj.y, obj.z);
    });
    
    return flattened;
}

// Output: { pose: [0.1, 0.3, 0.6, 0.2, 0.7, 0.9], label: "rock" }
