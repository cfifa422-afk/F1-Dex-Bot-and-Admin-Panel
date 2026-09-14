import { Router, type IRouter } from "express";
import {
  CreateDriverBody,
  DeleteDriverParams,
  GetActivityResponse,
  GetBotStatusResponse,
  GetDashboardResponse,
  GetDriversQueryParams,
  GetDriversResponse,
  GetPlayersQueryParams,
  GetPlayersResponse,
  RunBotActionBody,
  RunBotActionResponse,
  UpdateDriverBody,
  UpdateDriverParams,
} from "@workspace/api-zod";
import { activity, drivers, players, type Activity, type Driver } from "../data/f1-data";
import * as data from "../data/f1-data";

const router: IRouter = Router();

const now = () => new Date().toISOString();

router.get("/dashboard", (_req, res) => {
  const payload = {
    totalPlayers: players.length + 1847,
    activeGuilds: 38,
    cardsCollected: 12480,
    tradesToday: 142,
    weeklyClaims: 864,
    weeklyClaimsChange: 18.4,
    collectionCompletion: 67.2,
    topDriver: "Lando Norris",
    recentActivity: activity.slice(0, 5),
  };
  res.json(GetDashboardResponse.parse(payload));
});

router.get("/drivers", (req, res) => {
  const query = GetDriversQueryParams.parse(req.query);
  const search = query.search?.toLowerCase().trim();
  const result = search
    ? drivers.filter((driver) =>
        [driver.name, driver.shortName, driver.team, driver.nationality]
          .join(" ")
          .toLowerCase()
          .includes(search),
      )
    : drivers;
  res.json(GetDriversResponse.parse(result));
});

router.post("/drivers", (req, res) => {
  const input = CreateDriverBody.parse(req.body);
  const driver: Driver = {
    ...input,
    id: Math.max(0, ...drivers.map((item) => item.id)) + 1,
    imageUrl: input.imageUrl ?? null,
    spawnImageUrl: input.spawnImageUrl ?? null,
    spawnWeight: input.spawnWeight ?? 1,
    createdAt: now(),
  };
  drivers.unshift(driver);
  res.status(201).json(driver);
});

router.patch("/drivers/:id", (req, res) => {
  const params = UpdateDriverParams.parse({ id: Number(req.params.id) });
  const input = UpdateDriverBody.parse(req.body);
  const index = drivers.findIndex((driver) => driver.id === params.id);
  if (index === -1) {
    res.status(404).json({ error: "Driver not found" });
    return;
  }
  const updated = { ...drivers[index], ...input };
  drivers[index] = updated;
  res.json(updated);
});

router.delete("/drivers/:id", (req, res) => {
  const params = DeleteDriverParams.parse({ id: Number(req.params.id) });
  const index = drivers.findIndex((driver) => driver.id === params.id);
  if (index === -1) {
    res.status(404).json({ error: "Driver not found" });
    return;
  }
  drivers.splice(index, 1);
  res.status(204).send();
});

router.get("/players", (req, res) => {
  const query = GetPlayersQueryParams.parse(req.query);
  const search = query.search?.toLowerCase().trim();
  const result = players.filter((player) => {
    const matchesSearch =
      !search ||
      [player.username, player.discordTag, player.favoriteDriver]
        .join(" ")
        .toLowerCase()
        .includes(search);
    return matchesSearch && (!query.status || player.status === query.status);
  });
  res.json(GetPlayersResponse.parse(result));
});

router.get("/activity", (_req, res) => {
  res.json(GetActivityResponse.parse(activity));
});

router.get("/bot/status", (_req, res) => {
  res.json(
    GetBotStatusResponse.parse({
      connected: true,
      latencyMs: 42,
      guildCount: 38,
      version: "F1 Dex 0.1.0",
      branch: "v3",
      lastHeartbeat: now(),
    }),
  );
});

router.post("/bot/actions", (req, res) => {
  const { action } = RunBotActionBody.parse(req.body);
  const messages: Record<string, string> = {
    "sync-drivers": "Driver catalog sync queued for the next bot heartbeat.",
    "publish-drop": "A Singapore GP drop has been published to active guilds.",
    "refresh-cache": "Collection cache refreshed across all active guilds.",
    "pause-drops": data.dropsPaused ? "Drops resumed for all active guilds." : "Drops paused for all active guilds.",
  };
  if (action === "pause-drops") {
    data.toggleDropsPaused();
  }
  const payload = {
    success: true,
    action,
    message: messages[action],
    timestamp: now(),
  };
  const event: Activity = {
    id: Math.max(0, ...activity.map((item) => item.id)) + 1,
    type: "system",
    title: action === "pause-drops" ? (data.dropsPaused ? "Drops paused" : "Drops resumed") : "Bot action completed",
    detail: payload.message,
    timestamp: payload.timestamp,
    accent: "purple",
  };
  activity.unshift(event);
  req.log.info({ action }, "F1 Dex bot action completed");
  res.json(RunBotActionResponse.parse(payload));
});

export default router;