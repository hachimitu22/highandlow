enchant();	//おまじない

//グローバル変数(ほぼ定数と同じ意味で書いています。)
var SCREEN_WIDTH    = 320;	//画面幅	9leapに合わせた幅
var SCREEN_HEIGHT   = 320;	//画面高さ 9leapに合わせた高さ
var FRAME_RATE      = 24;	//フレームレート ブラウザゲーなのでこれだけ出てれば十分かなと

//ゲーム特有の定数
var PATTERN_SPADES		= 0;	//スペード
var PATTERN_DIAMONDS	= 1;	//ダイヤ
var	PATTERN_HEARTS		= 2;	//ハート
var PATTERN_CLUBS		= 3;	//クローバー
var PATTERN_CARDS		= 13;	//各柄の枚数
var TOTAL_CARDS			= 52;	//トランプの枚数(ジョーカー抜き)
//じっくり考えて欲しいので使わない方向で	var THINK_TIME			= FRAME_RATE * 10;	//シンキングタイムの時間
var SELECT_NONE			= 0;	//まだ選んでない状態
var SELECT_HIGH			= 1;	//HIGHを選択
var SELECT_LOW			= -1;	//LOWを選択

var TILE_REVERSE_RED	= 60; 

//assets path	全て直下におくこと
var IMAGE_PATH_FONT_2	= "font2.png";
//var IMAGE_PATH_ICON_0	= "icon0.png";
var IMAGE_PATH_CARD		= "card.png";

window.onload = function(){

	game = new Core(SCREEN_WIDTH, SCREEN_HEIGHT);
	game.fps = FRAME_RATE;
	game.preload(
		IMAGE_PATH_FONT_2,
//		IMAGE_PATH_ICON_0,
		IMAGE_PATH_CARD
	);
	
	/**
	 * 乱数の取得
	 *	param	n	
	 *	return	0 ～ n-1 のどれか
	 */
	function getRandValue(n){
		return Math.floor(Math.random()*n);
	};
	
	/**
	 * トランプ１枚分のクラス
	 *	param	id		トランプの各カードのID(0がスペードの1、51がクローバーの13)
	 *	param	isFront	表向きならtrue
	 */
	var Card = Class.create(Group, {
		initialize: function(id, isFront){
			Group.call(this);
		   
			//めくり状態のステータス定義
			this.eFlipStatus = {
				none:	0,
				// start:	1,
				doing:	2,
				end:	3,
			};
			this.flipStatus = this.eFlipStatus.none;


			this.pattern	= Math.floor(id / PATTERN_CARDS);	//柄
			this.number		= (id % PATTERN_CARDS) + 1;			//数字
			this.frameNumber = (this.pattern * PATTERN_CARDS) + (this.number - 1);
		
			//画像設定
			this.sprite = new Sprite(24, 32);
			this.sprite.image = game.assets[IMAGE_PATH_CARD];
			if(isFront === true){
				this.sprite.frame = this.frameNumber;
			} else {
				this.sprite.frame = TILE_REVERSE_RED;
			}
			
			this.addChild(this.sprite);
		},
		onenterframe: function(){
			switch(this.flipStatus){
				// case this.eFlipStatus.start:
					// this.setFlipAnimation();
					// break;
				case this.eFlipStatus.doing:
					break;
				case this.eFlipStatus.end:
					break;
			}
		},
		//カードをひっくり返す
		flip: function(){
			// this.flipStatus = this.eFlipStatus.start;
		// },
		// setFlipAnimation: function(){
			this.flipStatus = this.eFlipStatus.doing;
			this.tl
				.scaleTo(0.0, 1.0, 2)
				.then(function(){
					//ここから表に切り替わる
					this.sprite.frame = this.frameNumber;
				})
				.scaleTo(1.0, 1.0, 2)
				.then(function(){
					this.flipStatus = this.eFlipStatus.end;
				});
		},		
		//ひっくり返すのが終わったか
		isFinishFlip: function(){
			return (this.flipStatus === this.eFlipStatus.end);
		},
		//アニメーションなしで裏返す
		instantFlip: function(){
			this.sprite.frame = this.frameNumber;
			this.flipStatus = this.eFlipStatus.end;
		},
		//リストに並べる際の動作をセット
		setListMove: function(){
			//12, 16
			//13 * 
			//17 *
			var x = 20 + 15 * this.number;
			var y = 200 + 20 * this.pattern;
			this.tl
				.moveTo(x, y, 2).and()
				.scaleTo(0.5, 0.5, 2);//.and()
				// .rotateTo(360*10, 20);
		},
	});
	
	/**
	 * 画像の英文字列
	 *	param	tileTable	画像タイル番号の配列
	 *	param	width		幅
	 *	param	height		高さ
	 */
	var ImageString = Class.create(Group, {
		initialize: function(tileTable, width, height, color){
			Group.call(this);

			this.width = width;
			this.height = height;
			this.backgroundColor = color;
			
			this.str = [];
			for(var i=0, n=tileTable.length; i<n; i++){
				var x = ((this.width - n*16) / 2) + i*16;
				var y = (this.height - 16) / 2;
				this.str[i] = new Sprite(16, 16);
				this.str[i].image = game.assets[IMAGE_PATH_FONT_2];
				this.str[i].moveTo(x, y);
				this.str[i].frame = tileTable[i];
				this.addChild(this.str[i]);
			}
			this.opacity = 0.5;
		},
	});
	
	/**
	  * 主なゲーム画面、カジノのテーブルを意識した名前
	  * 基本はこのクラスで全て行う
	  */
	var GameTable = Class.create(Scene, {
        initialize: function(){
			Scene.call(this);

			//背景色の設定
			var surface = new Surface(game.width, game.height);
			surface.context.fillStyle = "orange";
			surface.context.fillRect(0, 0, game.width, game.height/2);
			surface.context.fillStyle = "green";
			surface.context.fillRect(0, game.height/2, game.width, game.height);
			this.backgroundSprite = new Sprite(game.width, game.height);
			this.backgroundSprite.image = surface;
			this.addChild(this.backgroundSprite);
			
			//---------------------------------------
			// 各状態の定義
			//---------------------------------------
			//ゲームの遷移
			this.eStatus = {
				playing:	1,	//HighLow選択中
				judge:		2,	//当落判定
				result:		3,	//結果
				end:		4,	//スコア表示またはゲームオーバー
			};
			//HighLowを選択したか
			this.eSelectStatus = {
				none:	1,
				did:	2,
				wait:	3,
			};
			//HighLowどちらを選んだか
			this.eTypeSelect = {
				none:	0,
				high:	1,
				low:	2,
			};
			//当落判定
			this.eResultStatus = {
				good:	1,
				bad:	2,
				doing:	3,
				end:	4,
			};

			this.status = this.eStatus.playing;
			this.selectStatus = this.eSelectStatus.none;
			this.typeSelect = this.eTypeSelect.none;
			this.ResultStatus = this.eResultStatus.good;
			
			this.score = 0;
			//トランプ一式
			this.cards = [];
			for(var i=0; i<TOTAL_CARDS; i++){
				this.cards[i] = new Card(i, false);
			}
			this.cardShuffle();	//シャッフルさせたいだけ書く
			this.cardShuffle();
			this.cardShuffle();
			for(var i=0; i<TOTAL_CARDS; i++){
				this.cards[i].moveTo(100 + i*30, 100);
				this.addChild(this.cards[i]);
			}
			this.cardCount = 0;
			
			this.openCard = this.cards[this.cardCount];	//表になっているカード
			this.openCard.instantFlip();
			this.cardCount++;
			this.setCard = this.cards[this.cardCount];	//裏向きのカード

			//
			this.imgStrHigh = new ImageString([40, 73, 71, 72], 70, 20, "red");
			var x = (game.width - this.imgStrHigh.width) / 2;
			var y = game.height/2 - this.imgStrHigh.height;
			this.imgStrHigh.moveTo(x, y);

			this.imgStrLow = new ImageString([44, 79, 87], 70, 20, "red");
			x = (game.width - this.imgStrLow.width) / 2;;
			y = game.height/2;
			this.imgStrLow.moveTo(x, y);
			
			this.addChild(this.imgStrHigh);
			this.addChild(this.imgStrLow);
			
			//デバッグ用
			// this.label = new Label();
			// this.addChild(this.label);
		},
		onenterframe: function(){
		
			switch(this.status){
				case this.eStatus.playing:
					this.playing();
					break;
				case this.eStatus.judge:
					this.judge();
					break;
				case this.eStatus.result:
					this.result();
					break;
				case this.eStatus.clear:
					var score = this.score;
					var message = "最後まで当てました！すごい！！"
					game.end(this.score, message);
					break;
				case this.eStatus.end:
					var score = this.score;
					var message = score + "枚正解しました。"
					game.end(this.score, message);
					break;
			}
			
		},
		ontouchstart: function(e){
			if(this.selectStatus === this.eSelectStatus.none){
				if(e.y > game.height/2){
					this.typeSelect = this.eTypeSelect.low;
				} else {
					this.typeSelect = this.eTypeSelect.high;
				}
			
				this.selectStatus = this.eSelectStatus.did;
			}
		},
		//シャッフル
		cardShuffle: function(){
			var n = TOTAL_CARDS;

			for(i=n-1; i>0; i--){
				var j = getRandValue(n);
				var tmp = this.cards[i];
				this.cards[i] = this.cards[j];
				this.cards[j] = tmp;
			}
		},
		//1サイクル毎の初期化
		cycleInit: function(){
			//状態初期化
			this.status = this.eStatus.playing;
			this.selectStatus = this.eSelectStatus.none;
			this.typeSelect = this.eTypeSelect.none;
			this.ResultStatus = this.eResultStatus.good;
			
			//カウントアップ
			this.score++;
			this.cardCount++;
			
			if(this.cardCount < TOTAL_CARDS){
				//カードの入れ替え
				this.openCard = this.setCard;
				this.setCard = this.cards[this.cardCount];
			} else {
				//最後のカードをめくったとき
				this.status = this.eStatus.clear;
			}
		},
		//HighLow選択中
		playing: function(){
			switch(this.selectStatus){
				case this.eSelectStatus.none:
					//ボタン処理
					break;
				case this.eSelectStatus.did:
					this.selectStatus = this.eSelectStatus.wait;
					this.setCard.flip();
					break;
				case this.eSelectStatus.wait:
					if(this.setCard.isFinishFlip() === true){
						this.status = this.eStatus.judge;
						this.selectStatus = this.eSelectStatus.none;
					}
					break;
			}
		},
		//当落判定
		judge: function(){
			var good = false;
			var open = this.openCard.number;
			var set = this.setCard.number;
			
			//判定
			if(open === set){
				good = true;
			} else {
				switch(this.typeSelect){
					case this.eTypeSelect.none:
						//エラー
						console.log("judge関数内でエラー:HighLowを選択してない");
						break;
					case this.eTypeSelect.high:
						if(open === 1){
							good = false;
						} else if(set === 1){
							good = true;
						} else {
							good = (open < set);
						}
						break;
					case this.eTypeSelect.low:
						if(open === 1){
							good = true;
						} else if(set === 1){
							good = false;
						} else {
							good = (open > set);
						}
						break;
				}
			}
			
			if(good === true){
				this.resultStatus = this.eResultStatus.good;
			} else {
				this.resultStatus = this.eResultStatus.bad;
			}
			
			this.status = this.eStatus.result;
		},
		//結果
		result: function(){
			switch(this.resultStatus){
				case this.eResultStatus.good:
					this.setGoodAnimation();
					break;
				case this.eResultStatus.bad:
					this.setBadAnimation();
					break;
				case this.eResultStatus.doing:
					//アニメーション中
					break;
				case this.eResultStatus.end:
					this.cycleInit();
					break;
			}
		},
		//正解時のアニメーション
		setGoodAnimation: function(){
			this.openCard.setListMove();
			this.cards[this.cardCount].tl
				.moveTo(100, 100, 2)
				.then(function(){
					this.parentNode.resultStatus = this.parentNode.eResultStatus.end;
				});
			for(var i=this.cardCount+1; i<TOTAL_CARDS; i++){
				var x = 100 + (i-this.cardCount)*30;
				this.cards[i].tl.moveTo(x, 100, 2);
			}
				
			this.resultStatus = this.eResultStatus.doing;
		},
		//不正解時のアニメーション
		setBadAnimation: function(){
			var x = 100;
			var time = getRandValue(10);
			this.cards[0].tl.moveTo(x, game.height+20, time)
				.delay(10)
				.then(function(){ this.parentNode.status = this.parentNode.eStatus.end; });

			for(var i=1; i<TOTAL_CARDS; i++){
				x = 100 + (i-this.cardCount)*30;
				time = getRandValue(10);
				this.cards[i].tl.moveTo(x, game.height+20, time);
			}

			this.resultStatus = this.eResultStatus.doing;
		},
	});
	
	/**
	 * メイン処理
	 */
	game.onload = function(){
		game.pushScene(new GameTable());
	};
	
	game.start();
};
