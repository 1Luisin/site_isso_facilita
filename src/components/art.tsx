import type { Product } from "@/lib/data";
import Image from "next/image";
export function ProductArt({
  product,
  sizes = "(max-width: 580px) calc((100vw - 48px) / 2), (max-width: 800px) calc((100vw - 80px) / 2), (max-width: 1200px) calc((100vw - 102px) / 4), 295px",
  eager = false,
}: {
  product: Product;
  sizes?: string;
  eager?: boolean;
}) {
  if (product.image)
    return (
      <div className={"product-art " + product.color}>
        <picture>
          <source
            type="image/webp"
            srcSet={`${product.image.replace(".webp", "-480.webp")} 480w, ${product.image} 900w`}
            sizes={sizes}
          />
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes={sizes}
            loading={eager ? "eager" : "lazy"}
            style={{ objectFit: "contain", padding: "12px" }}
          />
        </picture>
      </div>
    );
  return (
    <div
      className={"product-art " + product.color}
      role="img"
      aria-label={"Ilustração de " + product.name}
    >
      <svg viewBox="0 0 240 190" fill="none" aria-hidden="true">
        <ellipse
          cx="120"
          cy="160"
          rx="65"
          ry="9"
          fill="#735453"
          opacity=".09"
        />
        {product.art === "lamp" && (
          <>
            <path d="M120 76v73" stroke="#be7c88" strokeWidth="9" />
            <ellipse cx="120" cy="151" rx="38" ry="9" fill="#d699a3" />
            <path d="M66 78c2-62 106-62 108 0v10H66Z" fill="#e8aeba" />
            <ellipse cx="120" cy="88" rx="54" ry="9" fill="#fff3da" />
            <path
              d="M83 65c4-14 15-23 29-26"
              stroke="#f9d7dd"
              strokeWidth="7"
              strokeLinecap="round"
            />
          </>
        )}
        {product.art === "mat" && (
          <>
            <path
              d="M41 76Q34 46 66 51Q84 26 111 47Q145 27 166 51Q206 46 202 83L193 132Q120 157 44 130Z"
              fill="#d6a0ae"
            />
            <path
              d="M43 72Q36 45 68 50Q87 25 111 46Q145 26 166 50Q203 46 201 80L192 122Q119 146 46 120Z"
              fill="#efbfca"
            />
            <rect
              x="131"
              y="66"
              width="33"
              height="46"
              rx="17"
              fill="#fff9f7"
              transform="rotate(12 131 66)"
            />
            <path d="m145 70-2 10" stroke="#cb9cac" strokeWidth="2" />
          </>
        )}
        {product.art === "led" && (
          <>
            <ellipse
              cx="113"
              cy="101"
              rx="59"
              ry="43"
              stroke="#c8a4da"
              strokeWidth="18"
            />
            <ellipse
              cx="113"
              cy="101"
              rx="59"
              ry="43"
              stroke="#fff2ff"
              strokeWidth="5"
              strokeDasharray="4 10"
            />
            <path
              d="M168 111q32 28 9 39h-32"
              stroke="#ad91bd"
              strokeWidth="5"
            />
            <rect
              x="133"
              y="143"
              width="24"
              height="13"
              rx="4"
              fill="#eee5f3"
            />
          </>
        )}
        {product.art === "bunny" && (
          <>
            <ellipse
              cx="104"
              cy="53"
              rx="13"
              ry="32"
              fill="#fffcf4"
              transform="rotate(-12 104 53)"
            />
            <ellipse
              cx="139"
              cy="53"
              rx="13"
              ry="32"
              fill="#fffcf4"
              transform="rotate(12 139 53)"
            />
            <ellipse cx="120" cy="127" rx="37" ry="32" fill="#fffaf0" />
            <circle cx="120" cy="90" r="37" fill="#fffdf5" />
            <circle cx="107" cy="87" r="3" fill="#65514f" />
            <circle cx="134" cy="87" r="3" fill="#65514f" />
            <path d="m117 97 4 3 4-3" stroke="#ac7c7a" strokeWidth="2" />
            <ellipse cx="96" cy="97" rx="8" ry="4" fill="#efc2c2" />
            <ellipse cx="145" cy="97" rx="8" ry="4" fill="#efc2c2" />
          </>
        )}
        {product.art === "headphone" && (
          <>
            <path d="M120 67v84" stroke="#c3a3a6" strokeWidth="8" />
            <ellipse cx="120" cy="154" rx="37" ry="8" fill="#d3b1b7" />
            <path
              d="M78 103V81a42 42 0 0 1 84 0v22"
              stroke="#cc8fa2"
              strokeWidth="13"
            />
            <rect x="67" y="86" width="23" height="40" rx="10" fill="#ebbac7" />
            <rect
              x="150"
              y="86"
              width="23"
              height="40"
              rx="10"
              fill="#ebbac7"
            />
          </>
        )}
        {product.art === "cables" && (
          <>
            {[0, 1, 2].map((i) => (
              <g key={i} transform={"translate(" + i * 49 + " " + i * 8 + ")"}>
                <path d="M66 51v90" stroke="#b3a18d" strokeWidth="5" />
                <rect
                  x="49"
                  y="74"
                  width="34"
                  height="39"
                  rx="13"
                  fill={["#dbb6be", "#d5cdb2", "#bac5b2"][i]}
                />
                <path
                  d="M65 85v15"
                  stroke="#fff7ed"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </g>
            ))}
          </>
        )}
        {product.art === "laptop" && (
          <>
            <path
              d="m76 147 51-52 42 52"
              stroke="#91a89f"
              strokeWidth="9"
              strokeLinejoin="round"
            />
            <path d="m55 64 118-20 20 74-119 22Z" fill="#a5bcb3" />
            <path d="m62 69 105-18 16 59-104 20Z" fill="#eaf1e9" />
            <path d="m74 140 119-22-11 12-115 21Z" fill="#829e94" />
            <path
              d="m102 84 40-7"
              stroke="#d3e0d3"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </>
        )}
        {product.art === "hub" && (
          <>
            <path d="M92 88Q57 52 104 45" stroke="#a89aae" strokeWidth="6" />
            <rect x="99" y="34" width="20" height="15" rx="3" fill="#b7a9c0" />
            <rect
              x="61"
              y="86"
              width="121"
              height="49"
              rx="14"
              fill="#bdafcb"
              transform="rotate(-9 61 86)"
            />
            {[0, 1, 2, 3].map((i) => (
              <rect
                key={i}
                x={79 + i * 23}
                y={100 - i * 3.5}
                width="14"
                height="9"
                rx="2"
                fill="#72667c"
              />
            ))}
          </>
        )}
      </svg>
      <span className="art-sparkle">✧</span>
    </div>
  );
}
