export class Triangle{

    /**
     * Dreieck besteht aus drei Vertices gegeben in Form von Indice
     * 
     * @param {*} i1 vertex indice
     * @param {*} i2 vertex indice
     * @param {*} i3 vertex indice
     * @param {*} position position of first vertex indice in indice list
     */
    constructor(i1, i2, i3, position){

    }

    has(i){
        return (i == i1 || i == i2 || i == i3)
    }

    /**
     * https://math.stackexchange.com/questions/305642/how-to-find-surface-normal-of-a-triangle
     * @param {Vec3} vertices
     */
    calculateNormal(vertices){
        let v12 = v3.sub(vertices[this.i2], vertices[this.i1])
        let v23 = v3.sub(vertices[this.i3], vertices[this.i1])
        return v3.cross(v12, v23)
    }
}