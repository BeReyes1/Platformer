class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 310;
        this.DRAG = 480;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1100; //1500
        this.JUMP_VELOCITY = -500; //-600
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;

        this.score = 0;
        this.collectedDonuts = 0;
        this.gameOver = false;
    }

    create() {
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
    
        this.map = this.add.tilemap("foodfight", 18, 18, 40, 20);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("foodfighttiles", "tilemap_tiles");

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground", this.tileset, 0, 0);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true,
        });

        

        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels + 20);
        // TODO: Add createFromObjects here


        // TODO: Add turn into Arcade Physics here
        

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(30, 200, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        this.deathLayer = this.map.createLayer("Death", this.tileset, 0, 0);
        this.deathLayer.setCollisionByProperty({
            collides: true,
        });

        
        this.physics.add.collider(my.sprite.player, this.deathLayer, ()=> {
            this.PlayerDeath();
        });

        this.deathLayer.setVisible(false);

        this.platformLayer = this.map.createLayer("Platforms", this.tileset, 0, 0);
        this.platformLayer.setCollisionByProperty({
            collides: true,
        });


        //one-way platforms
        this.physics.add.collider(my.sprite.player, this.platformLayer, null, (player, tile) => {
            return player.body.velocity.y >= 0 && player.y + player.height / 2 <= tile.pixelY + 5;
        }, this);

        // TODO: Add coin collision handler
        this.collectableLayer = this.map.createLayer("Collectable", this.tileset, 0, 0);

        // Make it collidable
        this.collectableLayer.setCollisionByProperty({
            collectable: true,
        });

        this.physics.add.collider(my.sprite.player, this.collectableLayer, (player, tile) => {
            this.DonutCollected(player, tile);
        });

        this.winLayer= this.map.createLayer("Win", this.tileset, 0, 0);
        this.winLayer.setCollisionByProperty({
            collides: true,
        });

        this.physics.add.collider(my.sprite.player, this.winLayer, () => {
            this.WinGame();
        });



        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        // TODO: Add movement vfx here
          my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['star_01.png', 'star_09.png'],
            // TODO: Try: add random: true
            scale: {start: 0.03, end: 0.07},
            maxAliveParticles: 4,
            lifespan: 350,
            alpha: {start: 1, end: 0.1}, 
        });

        my.vfx.walking.stop();

        
        my.vfx.jumping = this.add.particles(0, 0, "kenny-particles", {
            frame: ['scorch_01.png', 'scorch_03.png'],
            // TODO: Try: add random: true
            scale: {start: 0.03, end: 0.15},
            maxAliveParticles: 3,
            lifespan: 500,
            alpha: {start: 1, end: 0.1}, 
        });

        my.vfx.jumping.stop();
        
        

        // TODO: add camera code here
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels-500);

        this.cameras.main.startFollow(my.sprite.player);

        this.cameras.main.setBackgroundColor('#ff69b4');
        this.cameras.main.setZoom(2.5);


    }

    update() {

        if (this.gameOver) {
            if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
                this.scene.restart();
            }
            return;
        }

        if(cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            
              my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {

                my.vfx.walking.start();

            }

        } else if(cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {

                my.vfx.walking.start();

            }

        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            my.vfx.walking.stop();
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            this.sound.play("jump");

            
            my.vfx.jumping.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.jumping.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            my.vfx.jumping.explode(8, my.sprite.player.x, my.sprite.player.y + my.sprite.player.displayHeight / 2);
        }
    }

    DonutCollected(player, tile) {
        let x = tile.getCenterX(); 
        let y = tile.getCenterY(); 
        this.collectableLayer.removeTileAtWorldXY(x, y);

        this.collectedDonuts++;
    
    }

    PlayerDeath() {
        if (this.gameOver) {
            return;
        }

        this.gameOver = true;
        this.add.text(my.sprite.player.x, my.sprite.player.y - 100, "TOO BAD!", {fontSize: '64px'}).setOrigin(0.5);;
        this.add.text(my.sprite.player.x, my.sprite.player.y, "(Press 'R' to restart)", {fontSize: '32px'}).setOrigin(0.5);;
    }

    WinGame() {
        if (this.gameOver) {
            return;
        }

        this.gameOver = true;
        this.add.text(my.sprite.player.x - 200, my.sprite.player.y - 100, "YOU WIN!", {fontSize: '50px'}).setOrigin(0.5);;
        this.add.text(my.sprite.player.x - 200, my.sprite.player.y, "Donuts Collected: " + this.collectedDonuts, {fontSize: '15px'}).setOrigin(0.5);;
        this.add.text(my.sprite.player.x - 200, my.sprite.player.y + 50, "(Press 'R' to Play Again)", {fontSize: '20px'}).setOrigin(0.5);;
    }
}