function dot(vector1, vector2) {
    var result = 0;
    for (var i = 0; i < 3; i++) {
        result += vector1[i] * vector2[i];
    }
    return result;
}
function scale(vec, s){
    result = []
    result[0] = vec[0] * s
    result[1] = vec[1] * s
    result[2] = vec[2] * s
    return result
}
function add(vec1, vec2){
    result = []
    result[0] = vec1[0] + vec2[0]
    result[1] = vec1[1] + vec2[1]
    result[2] = vec1[2] + vec2[2]
    return result
}
function neg(vec){
    result = []
    result[0] = -vec[0]
    result[1] = -vec[1]
    result[2] = -vec[2]
    return result
}
function clamp(val, min, max){
    return Math.min(Math.max(min, val), max)
}


function refract(incident, n){
    const eta = 1
    let c1 = dot(n, incident);
    let c2 = Math.sqrt(1.0 - (eta*eta) * (1.0 - c1*c1));
    let t = add(scale(incident, eta), scale(n, (eta*c1 - c2)));
    return t;
}

function refract2(I, N){
    let cosi = clamp(dot(I, N), -1, 1); 
    let etai = 1;
    let etat = 1; 
    if (cosi < 0) { 
        cosi = -cosi; 
    } else { 
        let temp = etai;
        etai = etat;
        etat = temp;
        N = neg(N);
    } 
    let eta = etai / etat; 
    let k = 1 - eta*eta * (1 - cosi*cosi); 
    if (k < 0) 
        return 0 // why/when dis?
    let out = add(scale(I, eta), scale(N, (eta*cosi - Math.sqrt(k))));  
    return out
} 



i = [0, 5, 0]
n = [0, 1, 0]

console.log(refract2(i, n));

// Problem: wenn n 
