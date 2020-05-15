export const water_vs = 
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



export const water_fs = 
`
    precision highp float;

    varying vec4 v_position;
    varying vec3 v_normal;

    uniform vec3 u_cameraPosition;
    uniform sampler2D u_bottomTexture;

    // bottom sclae + transform über bottomModelMat?
    // später generisch als struc für alle wande mit position
    // parameterfrom?
    float d = -0.5;
    float w = 4.0;
    float l = 4.0;
    

    vec2 getUVFromRectangle(vec2 hit, float rectWidth, float rectHeight){
        float u = (hit.x + 0.5*rectWidth)/rectWidth;
        float v = (hit.y + 0.5*rectHeight)/rectHeight;
        return vec2(u, v);
    }

    bool isHitInRectangle(vec2 hit, float rectWidth, float rectHeight){
        bool u = -rectWidth/2.0 <= hit.x && hit.x <= rectWidth/2.0;
        bool v = -rectHeight/2.0 <= hit.y && hit.y <= rectHeight/2.0;
        return u && v;
    }

    // d ist verschiebung in richtung n
    // returns scalar t. hit = origin + t*ray
    float intersectRayPlane(vec3 origin, vec3 ray, vec3 n, float d){
        float t = (d - dot(n, origin)) / dot(n, ray);
        return t;
    } 

    vec3 refract(vec3 incident, vec3 n){
        float etai = 1.0;
        float etat = 1.33; 

        float cosi = clamp(dot(incident, n), -1.0, 1.0); 
        if (cosi < 0.0) { 
            cosi = -cosi; 
        } else { 
            float temp = etai;
            etai = etat;
            etat = temp;
            n = -n;
        } 
        float eta = etai / etat; 
        float k = 1.0 - eta*eta * (1.0 - cosi*cosi); 
        return eta*incident + (eta*cosi - sqrt(k))*n;  
    }
    
    vec3 reflect(vec3 ray, vec3 n){
        return ray - 2.0 * dot(ray, n) * n; 
    }

    void main() {
        vec3 ray = normalize(v_position.xyz - u_cameraPosition);

        vec3 refractRay = refract(ray, v_normal);

        float t = intersectRayPlane(v_position.xyz, refractRay, v_normal, d);
        vec3 hit = v_position.xyz + t * refractRay;
        bool intersectBottom = isHitInRectangle(hit.xz, w, l); 

        if(t > 0.0 && intersectBottom){
            vec2 uv = getUVFromRectangle(hit.xz, w, l);
            gl_FragColor = texture2D(u_bottomTexture, uv);
        } else {
            gl_FragColor = vec4(v_normal, 1.0);
        }
    }

`