export const texture_vs = 
`
    precision highp float;

    uniform mat4 u_model;
    uniform mat4 u_view;
    uniform mat4 u_projection;

    attribute vec3 a_position;
    attribute vec3 a_normal;
    attribute vec2 a_texcoord;

    varying vec4 v_position;
    varying vec3 v_normal;
    varying vec2 v_texcoord;

    void main() {
        v_normal = a_normal;
        v_position = u_model * vec4(a_position, 1.0);
        v_texcoord = a_texcoord;;
        gl_Position = u_projection * u_view * v_position; 
    }
`

export const texture_fs = 
`
    precision highp float;

    varying vec4 v_position;
    varying vec3 v_normal;
    varying vec2 v_texcoord;

    uniform sampler2D u_texture;

    void main() {
        gl_FragColor = texture2D(u_texture, v_texcoord);
    }
`