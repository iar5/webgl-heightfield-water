export const checker_vs = 
`
    precision highp float;

    uniform mat4 u_model;
    uniform mat4 u_view;
    uniform mat4 u_projection;

    attribute vec3 a_position;
    attribute vec3 a_normal;
    
    varying vec4 v_position;
    varying vec3 v_normal;

    void main() {
        v_normal = a_normal; 
        v_position = u_model * vec4(a_position, 1.0);
        gl_Position = u_projection * u_view * v_position; 
    }
`

export const checker_fs = 
`
    precision highp float;

    varying vec4 v_position;
    varying vec3 v_normal;

    uniform vec3 ambient;
    uniform vec3 sunPosition;
    uniform	vec3 sunColor;


    void main() {
        float c = (v_position.x + v_position.z) * 10.0;
        bool isEven = mod(c, 2.0) >= 1.0;

        if(isEven) {
            gl_FragColor = vec4(0, 0, 0, 1);
        }
        else {           
            gl_FragColor = vec4(0.9, 0.9, 0.9, 1);
        }
    }
`