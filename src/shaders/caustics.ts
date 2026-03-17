export const causticVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const causticFragmentShader = `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uIntensity;

  varying vec2 vUv;

  // Soft noise for organic movement
  vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)),
             dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(mix(dot(hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
                   dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
               mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
                   dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
  }

  // Caustic pattern - simulates light refracting through water surface
  float caustic(vec2 uv, float time) {
    float scale = 4.0;
    vec2 p = uv * scale;

    // Layer multiple wave patterns
    float c = 0.0;

    // Wave layer 1 - slow, large
    vec2 wave1 = p + vec2(time * 0.03, time * 0.02);
    c += sin(noise(wave1) * 6.2831) * 0.5 + 0.5;

    // Wave layer 2 - medium speed, medium scale
    vec2 wave2 = p * 1.4 + vec2(-time * 0.04, time * 0.03);
    c += sin(noise(wave2) * 6.2831 + 1.0) * 0.5 + 0.5;

    // Wave layer 3 - faster, finer detail
    vec2 wave3 = p * 2.1 + vec2(time * 0.02, -time * 0.05);
    c += sin(noise(wave3) * 6.2831 + 2.0) * 0.5 + 0.5;

    c /= 3.0;

    // Sharpen the caustic lines - where waves converge
    c = pow(c, 1.8);

    // Brighten the convergence points
    c = smoothstep(0.2, 0.8, c);

    return c;
  }

  void main() {
    vec2 uv = vUv;

    // Adjust for aspect ratio
    float aspect = uResolution.x / uResolution.y;
    vec2 adjustedUv = vec2(uv.x * aspect, uv.y);

    float time = uTime * 0.4;

    // Two caustic layers at different scales for depth
    float c1 = caustic(adjustedUv, time);
    float c2 = caustic(adjustedUv * 0.7 + vec2(3.14), time * 0.8);

    // Blend the two layers
    float c = mix(c1, c2, 0.4);

    // Base color - warm pearl
    vec3 pearl = vec3(0.961, 0.941, 0.922);     // #F5F0EB
    vec3 sand = vec3(0.918, 0.886, 0.839);       // #EAE2D6
    vec3 causticGold = vec3(0.941, 0.875, 0.753); // #F0DFC0
    vec3 blush = vec3(0.91, 0.835, 0.808);        // #E8D5CE
    vec3 powderBlue = vec3(0.839, 0.898, 0.937);  // #D6E5EF

    // Background gradient - underwater looking up
    vec3 bg = mix(sand, pearl, uv.y * 0.6 + 0.4);

    // Add subtle blue depth toward bottom
    bg = mix(bg, powderBlue, (1.0 - uv.y) * 0.15);

    // Caustic light - warm gold-white dancing on the surface
    vec3 causticColor = mix(causticGold, vec3(1.0, 0.98, 0.95), 0.5);

    // Apply caustic with intensity control
    vec3 color = bg + causticColor * c * uIntensity * 0.25;

    // Add very subtle blush tint where light is strongest
    color = mix(color, blush, c * 0.06);

    // Subtle vignette - darker at edges like being underwater
    float vignette = 1.0 - length((uv - 0.5) * 1.2) * 0.3;
    color *= vignette;

    // Light sparkle points - tiny bright flecks
    float sparkle = noise(adjustedUv * 20.0 + time * 0.5);
    sparkle = pow(max(sparkle, 0.0), 12.0) * 0.3;
    color += vec3(sparkle) * uIntensity;

    gl_FragColor = vec4(color, 1.0);
  }
`;
