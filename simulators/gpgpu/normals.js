/**
1. Dreieck Normals
2. Vertex normals 

= zwei FBOs?


// The data in the texture is (position.y, velocity.y, normal.x, normal.z)

 **/

export const normals_vs = 
`
    precision highp float;

    attribute vec2 a_position; 

    varying vec2 v_texcoord;  

    void main() {
        v_texcoord = 0.5 * a_position + 0.5; 
        gl_Position = vec4(a_position, 0.0, 1.0); 
    }
`

export const normals_fs = `

uniform sampler2D texture;
uniform vec2 delta;
varying vec2 coord;

void main() {
  /* get vertex info */
  vec4 info = texture2D(texture, coord);
  
  /* update the normal */
  vec3 dx = vec3(delta.x, texture2D(texture, vec2(coord.x + delta.x, coord.y)).r - info.r, 0.0);
  vec3 dy = vec3(0.0, texture2D(texture, vec2(coord.x, coord.y + delta.y)).r - info.r, delta.y);
  info.ba = normalize(cross(dy, dx)).xz;
  
  gl_FragColor = info;
}

`