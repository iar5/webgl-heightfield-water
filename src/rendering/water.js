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

    uniform float u_poolHeight; 
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
    float ht = (u_poolHeight-12./24.)*2.; // y+

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
        // https://www.scratchapixel.com/lessons/3d-basic-rendering/introduction-to-shading/reflection-refraction-fresnel
        float kr = 0.;
        float cosi = clamp(-1., 1., dot(incoming, normal)); 
        float etai = n1 ;
        float etat = n2; 
        if (cosi > 0.) { 
            etai = n2;
            etat = n1;
        } 
        // Compute sini using Snell's law
        float sint = etai / etat * sqrt(max(0., 1.-cosi * cosi)); 
        // Total internal reflection
        if (sint >= 1.) { 
            kr = 1.; 
        } 
        else { 
            float cost = sqrt(max(0., 1. - sint * sint)); 
            cosi = abs(cosi); 
            float Rs = ((etat * cosi) - (etai * cost)) / ((etat * cosi) + (etai * cost)); 
            float Rp = ((etai * cosi) - (etat * cost)) / ((etai * cosi) + (etat * cost)); 
            kr = (Rs * Rs + Rp * Rp) / 2.; 
        } 
        return 1.-kr;  
    }

    float sfresnel(vec3 incoming, vec3 normal, float eta){
        float fresnel = dot(incoming, normal);
        fresnel = pow(fresnel, 2.0);
        fresnel = max(0.1, fresnel);
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

        float fresnel = (length(refractRay) == 0. ? 0. : sfresnel(eyeRay, normal, eta));
        vec4 color = mix(refractC, reflectC, fresnel);

        gl_FragColor = color;
        gl_FragColor.b = 1.0;
    }
`


/**

// old version with pool wall rectangle hit and textur instead of cubemap
 
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
 */