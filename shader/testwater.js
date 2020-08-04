export const test_vs = 
`
    precision highp float;

    uniform mat4 u_model;
    uniform mat4 u_view;
    uniform mat4 u_projection;
    uniform sampler2D u_texture;

    attribute vec3 a_position;
    attribute vec2 a_uv;

    varying vec4 v_color;

    void main() {
        vec4 texv = texture2D(u_texture, a_uv);
        v_color = texv;

        vec4 position = u_model * vec4(a_position.x, a_position.y, a_position.z, 1.0);
        position.y += 0.; //texv.z * 10.; // tex values in 0-1 range?
        
        gl_Position = u_projection * u_view * position; 
    }
`

export const test_fs = 
`
    precision highp float;

    varying vec4 v_color;

    void main() {
        gl_FragColor = v_color;
    }
`