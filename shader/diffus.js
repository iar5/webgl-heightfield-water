export const diffus_vs = 
`
    precision highp float;

    uniform mat4 u_projection;
    uniform mat4 u_view;
    uniform mat4 u_model;

    attribute vec3 a_position;
    attribute vec3 a_normal;
    
    varying vec4 v_position;
    varying vec3 v_normal;
    varying vec4 v_color;

    void main() {
        v_color = vec4(0, 0, 1, 1);
        v_normal = a_normal; // TODO modelMat anwenden für wenn model uneinheitlich skaliert oder rotiert -> Normalmatrix

        v_position = vec4(a_position, 1.0);
        v_position = u_model * v_position;
       
        gl_Position = u_projection * u_view * v_position;
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
        //vec3 normSunDir = normalize(sunPosition - v_position.xyz); // point light
        vec3 normSunDir = normalize(sunPosition); // directional light

        vec3 lightIntensity = ambient + sunColor * max(dot(v_normal, normSunDir), 0.0);
        
        gl_FragColor = vec4(v_color.rgb * lightIntensity, v_color.a);
    }
`