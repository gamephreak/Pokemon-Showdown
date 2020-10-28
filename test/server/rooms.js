'use strict';

const assert = require('assert').strict;

const {User} = require('../users-utils');

describe('Rooms features', function () {
	describe('Rooms', function () {
		describe('Rooms.get', function () {
			it('should be a function', function () {
				assert.equal(typeof Rooms.get, 'function');
			});
		});
		describe('Rooms.rooms', function () {
			it('should be a Map', function () {
				assert(Rooms.rooms instanceof Map);
			});
		});
	});

	describe('GameRoom', function () {
		const packedTeam = 'Weavile||lifeorb||swordsdance,knockoff,iceshard,iciclecrash|Jolly|,252,,,4,252|||||';

		let room;
		let parent;
		afterEach(function () {
			for (const user of Users.users.values()) {
				user.disconnectAll();
				user.destroy();
			}
			if (room) room.destroy();
			if (parent) parent.destroy();
		});

		it('should allow two users to join the battle', function () {
			const p1 = new User();
			const p2 = new User();
			const options = [{rated: false, tour: false}, {rated: false, tour: {onBattleWin() {}}}, {rated: true, tour: false}, {rated: true, tour: {onBattleWin() {}}}];
			for (const option of options) {
				room = Rooms.createBattle('customgame', Object.assign({
					p1,
					p2,
					p1team: packedTeam,
					p2team: packedTeam,
				}, option));
				assert(room.battle.p1 && room.battle.p2); // Automatically joined
			}
		});
	});

	describe("ChatRoom", function () {
		describe("#rename", function () {
			let room;
			let parent;
			let subroom;
			afterEach(function () {
				for (const user of Users.users.values()) {
					user.disconnectAll();
					user.destroy();
				}
				const rooms = [room, parent, subroom];
				for (const room of rooms) {
					if (room) {
						room.destroy();
					}
				}
			});
			it("should rename its roomid and title", async function () {
				room = Rooms.createChatRoom("test", "Test");
				await room.rename("Test2");
				assert.equal(room.roomid, "test2");
				assert.equal(room.title, "Test2");
			});

			it("should rename its key in Rooms.rooms", async function () {
				room = Rooms.createChatRoom("test", "Test");
				await room.rename("Test2");
				assert.equal(Rooms.rooms.has("test"), false);
				assert.equal(Rooms.rooms.has("test2"), true);
			});

			it("should move the users and their connections", async function () {
				room = Rooms.createChatRoom("test", "Test");
				const user = new User();
				user.joinRoom(room);
				await room.rename("Test2");
				assert.equal(user.inRooms.has("test"), false);
				assert.equal(user.inRooms.has("test2"), true);
				assert.equal(user.connections[0].inRooms.has("test"), false);
				assert.equal(user.connections[0].inRooms.has("test2"), true);
			});

			it("should rename their parents subroom reference", async function () {
				parent = Rooms.createChatRoom("parent", "Parent");
				subroom = Rooms.createChatRoom("subroom", "Subroom", {parentid: "parent"});
				await subroom.rename("TheSubroom");
				assert.equal(parent.subRooms.has("subroom"), false);
				assert.equal(parent.subRooms.has("thesubroom"), true);
			});

			it("should rename their subrooms parent reference", async function () {
				parent = Rooms.createChatRoom("parent", "Parent");
				subroom = Rooms.createChatRoom("subroom", "Subroom", {parentid: "parent"});
				await parent.rename("TheParent");
				assert.equal(subroom.parent, parent);
			});
		});
	});
});
