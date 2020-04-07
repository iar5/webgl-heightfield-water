export const diffus_vs = 
`
    precision highp float;

    uniform mat4 u_model;
    uniform mat4 u_view;
    uniform mat4 u_projection;
    uniform vec4 u_color;

    attribute vec3 a_position;
    attribute vec3 a_normal;
    
    varying vec4 v_position;
    varying vec3 v_normal;
    varying vec4 v_color;

    void main() {
        v_color = u_color;
        v_normal = a_normal; // TODO Normalmatrix für wenn model skaliert oder rotiert wird
        v_position = u_model * vec4(a_position, 1.0);
        gl_Position = u_projection * u_view * v_position; // so ist korrekt mit v_position = model * position
    }
`

export const diffus_fs = 
`
    precision highp float;

    varying vec4 v_position;
    varying vec3 v_normal;
    varying vec4 v_color;

    uniform vec3 ambient;
    uniform vec3 sunPosition;
    uniform	vec3 sunColor;


    void main() {
        // idk why lightning is kind of working
        vec3 normSunDir = normalize(sunPosition - v_position.xyz); // point light
        //vec3 normSunDir = normalize(sunPosition); // directional light

        vec3 lightIntensity = ambient + sunColor * max(dot(v_normal, normSunDir), 0.0);
        
        gl_FragColor = vec4(v_color.rgb * lightIntensity, v_color.a);
    }
`