/**
 * water shader with reflektion/refraction based on a cubemap
 */
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



/**
 * Erklärung Ablauf
 * 1. hit berechnung von eye-fragment mit würfel (verschiebung der wasseroberfläche also über vertices)
 * 2. texturierung: der hit-vektor wird als winkel für cubemap genommen
 * 2.a wenn der pool skaliert oder verschoben ist, wird das beim hit vektor entsprechend gegengerechnet
 * 
 * Die komisch krumme Verzerrung bei gesetztem eta kommt wenn spiegelung statt refraction sein müsste 
 */
export const water_fs = 
`
    precision highp float;

    varying vec4 v_position;
    varying vec3 v_normal;

    uniform vec3 u_cameraPosition;
    uniform samplerCube u_cubeMap;
    uniform samplerCube u_cubeEnvMap;

    float n1 = 1.0; // air
    float n2 = 1.3; // water

    // parameters of the underlying pool, fetch them from modelmat?
    vec3 c = vec3(0, 0, 0); // pool center
    float w = 1.0; // x -+ distance to c
    float l = 1.0; // z -+
    float h = 1.0; // y -
    float ht = 4./24.; // y+ 

    // d ist verschiebung der ebene in richtung n vom nullpunkt
    // returns scalar t with hit = origin + t*ray
    float intersectRayPlane(vec3 origin, vec3 ray, vec3 n, float d){
        float t = (d - dot(n, origin)) / dot(n, ray);
        return t;
    }  

    vec4 intersectScene(vec3 ray){
        float t1 = intersectRayPlane(v_position.xyz-c, ray, vec3(0, -1, 0), -h); // top 
        float t2 = intersectRayPlane(v_position.xyz-c, ray, vec3(0, 1, 0), -h); // bottom
        float t3 = intersectRayPlane(v_position.xyz-c, ray, vec3(-1, 0, 0), -w);
        float t4 = intersectRayPlane(v_position.xyz-c, ray, vec3(1, 0, 0), -w);
        float t5 = intersectRayPlane(v_position.xyz-c, ray, vec3(0, 0, -1), -l);
        float t6 = intersectRayPlane(v_position.xyz-c, ray, vec3(0, 0, 1), -l);

        // get a valid value first, then find the smallest one above 0
        float t = max(0.0, max(t1, max(t2, max(t3, max(t4, max(t5, t6)))))); 
        if(t1 > 0.0 && t1 < t) { t = t1; } 
        if(t2 > 0.0 && t2 < t) { t = t2; } 
        if(t3 > 0.0 && t3 < t) { t = t3; } 
        if(t4 > 0.0 && t4 < t) { t = t4; } 
        if(t5 > 0.0 && t5 < t) { t = t5; } 
        if(t6 > 0.0 && t6 < t) { t = t6; } 

        vec3 hit = v_position.xyz + t*ray;

        if(hit.y > ht){
            return textureCube(u_cubeEnvMap, ray);
        }
        else{
            hit -= c; // cube map pos correction
            vec3 mRay = vec3(hit.x/w, hit.y/h, hit.z/l); // cube map scale correction
            return textureCube(u_cubeMap, mRay);
        }
    }

    float fresnel(vec3 incoming, vec3 normal, float eta){
        //float r0 = pow((n1-n2)/(n1+n2), 2.);
        //float fresnel = r0 + (1.-r0) * pow(1.-(dot(normal, incoming)), 5.);

        float fresnel = mix(0.5, 1.0, pow(1.0 - dot(-incoming, normal), 3.0)); // madebyevan
        //float fresnel = eta + (1.0 - eta) * pow(max(0.0, 1.0 - dot(-incoming, normal)), 5.0);
        return fresnel;
    }

    void main() {
        bool aboveWater = u_cameraPosition.y > v_position.y;

        vec3 eyeRay = normalize(v_position.xyz-u_cameraPosition);
        vec3 normal = aboveWater ? v_normal : -v_normal;
        float eta = aboveWater ? n1/n2 : n2/n1;
        vec3 refractRay = refract(eyeRay, normal, eta);        
        vec3 reflectRay = reflect(eyeRay, normal);

        vec4 refractC = intersectScene(reflectRay);
        vec4 reflectC = intersectScene(refractRay);

        float fresnel = (length(refractRay) == 0. ? 0. : fresnel(eyeRay, normal, eta));
        vec4 color = mix(refractC, reflectC, fresnel);

        gl_FragColor = color;
        gl_FragColor.b = 1.0;
    }
`