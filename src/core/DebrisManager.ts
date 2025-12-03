import { Debris } from '../entities/Debris';
import { Terrain } from '../entities/Terrain';
import { Vector2 } from './Vector2';

/**
 * デブリの管理を担当するクラス。
 * 
 * デブリの生成、更新、削除を管理します。
 */
export class DebrisManager {
    private debris: Debris[] = [];

    /**
     * すべてのデブリを更新します。
     * 
     * 各デブリの物理演算を行い、地形との衝突判定を実施します。
     * 非アクティブなデブリは配列から削除されます。
     * 
     * @param terrain - 地形
     */
    update(terrain: Terrain): void {
        // Reverse loop to safely remove elements while iterating
        for (let i = this.debris.length - 1; i >= 0; i--) {
            const d = this.debris[i];

            // Skip if debris is already stopped
            if (!d.active) {
                continue;
            }

            // Check collision with terrain BEFORE applying physics
            // This prevents debris from sinking into the ground
            let hitGround = false;
            for (let j = 0; j < terrain.points.length - 1; j++) {
                const p1 = terrain.points[j];
                const p2 = terrain.points[j + 1];
                if (d.position.x >= p1.x && d.position.x <= p2.x) {
                    // Interpolate Y
                    const t = (d.position.x - p1.x) / (p2.x - p1.x);
                    const groundY = p1.y + t * (p2.y - p1.y);
                    if (d.position.y >= groundY) {
                        // 地面に着いたら停止
                        d.position.y = groundY;
                        d.velocity.x = 0;
                        d.velocity.y = 0;
                        d.active = false; // 停止した残骸はこれ以上更新しない
                        hitGround = true;
                    }
                    break;
                }
            }

            // Only update if not on ground
            if (!hitGround) {
                d.update();
            }
        }
    }

    /**
     * デブリを生成します。
     * 
     * @param position - デブリの生成位置
     * @param count - 生成するデブリの数
     */
    spawn(position: Vector2, count: number): void {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            const vel = new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed);
            this.debris.push(new Debris(position, vel));
        }
    }

    /**
     * アクティブなデブリのみを取得します。
     * 
     * @returns アクティブなデブリの配列
     */
    getAll(): Debris[] {
        return this.debris.filter(d => d.active);
    }

    /**
     * すべてのデブリをクリアします。
     */
    clear(): void {
        this.debris = [];
    }
}
