# Application Design — Video Editor Refactoring (Foundation)

> Ngày: 2026-07-07
> Scope: Frontend only (TypeScript/React). Backend Rust giữ nguyên.

---

## 1. Module Structure

```text
src/pages/Editor/
├── model/                    ← NEW: Project Model layer
│   ├── types.ts              — All project interfaces (Project, Object, Asset, Track, Style, etc.)
│   ├── defaults.ts           — Default values, factory functions
│   └── index.ts              — Re-exports
│
├── assets/                   ← NEW: Asset Registry
│   ├── AssetRegistry.ts      — Asset CRUD operations
│   └── index.ts
│
├── viewport/                 ← NEW: Coordinate Space
│   ├── types.ts              — Viewport, CoordinateSpace interfaces
│   ├── viewport.ts           — Viewport creation, update logic
│   ├── convert.ts            — projectToScreen, screenToProject conversions
│   └── index.ts
│
├── scene/                    ← NEW: Scene Graph
│   ├── types.ts              — SceneNode, GroupNode, etc. interfaces
│   ├── builder.ts            — buildScene(project, currentTime, viewport)
│   ├── nodes.ts              — Node factory functions
│   └── index.ts
│
├── renderer/                 ← NEW: Renderer Abstraction
│   ├── types.ts              — Renderer interface
│   ├── HTMLRenderer.tsx       — Current rendering logic wrapped
│   └── index.ts
│
├── adapter/                  ← NEW: Migration + Persistence
│   ├── legacy.ts             — legacyToProject, projectToLegacy converters
│   └── index.ts
│
├── store.ts                  ← MODIFIED: Refactored to use Project Model
├── types.ts                  ← DEPRECATED: Replaced by model/types.ts (keep for transition)
├── constants.ts              ← KEPT: Presets become default styles
├── mockData.ts               ← MODIFIED: Updated to new Project format
├── index.tsx                 ← KEPT: Minimal changes
├── VideoPlayer.tsx           ← MODIFIED: Uses HTMLRenderer + Scene Graph
├── OverlayPanel.tsx          ← MODIFIED: Reads/writes via project store
├── OverlayViewport.tsx       ← DEPRECATED: Merged into HTMLRenderer
├── SubtitleTable.tsx         ← MODIFIED: Subtitle objects from project
├── StylePanel.tsx            ← MODIFIED: Style system from project.styles
├── EditorToolbar.tsx         ← KEPT: Minimal changes
└── editor.css                ← KEPT: No changes
```

---

## 2. Core Interfaces

### 2.1 Project Model (`model/types.ts`)

```typescript
// ─── Coordinate & Transform ──────────────────────────────────────

interface CoordinateSpace {
  width: number;   // 1920
  height: number;  // 1080
}

interface Point {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface Transform {
  position: Point | null;  // null = use style default (named position)
  size: Size;
  rotation: number;        // degrees, future use (default 0)
  opacity: number;         // 0-100 (default 100)
}

// ─── Project ─────────────────────────────────────────────────────

interface Project {
  metadata: ProjectMetadata;
  assets: Asset[];
  tracks: Track[];
  objects: EditorObject[];
  styles: EditorStyle[];
  settings: ProjectSettings;
}

interface ProjectMetadata {
  id: string;
  name: string;
  fps: number;
  duration: number;          // seconds
  coordinateSpace: CoordinateSpace;
  createdAt: string;
  updatedAt: string;
}

interface ProjectSettings {
  subtitleApplyAll: boolean;  // true = all cues share style, false = per-cue
  defaultSubtitleStyleId: string;
}

// ─── Asset ───────────────────────────────────────────────────────

type AssetType = "video" | "audio" | "image" | "font";

interface Asset {
  id: string;
  type: AssetType;
  source: string;           // file path or URL
  name: string;             // display name
  metadata: AssetMetadata;
}

interface AssetMetadata {
  fileSize?: number;
  width?: number;
  height?: number;
  duration?: number;
  mimeType?: string;
}

// ─── Track ───────────────────────────────────────────────────────

type TrackType = "video" | "subtitle" | "overlay";

interface Track {
  id: string;
  type: TrackType;
  objectIds: string[];      // ordered references to EditorObject.id
}

// ─── Object ──────────────────────────────────────────────────────

type ObjectType =
  | "subtitle"
  | "background_overlay"
  | "blur"
  | "mirror"
  | "text"
  | "logo"
  | "watermark";

interface EditorObject {
  id: string;
  type: ObjectType;
  startTime: number;        // seconds
  endTime: number;          // seconds
  transform: Transform;
  styleId: string | null;   // reference to EditorStyle.id (for subtitle + text)
  enabled: boolean;
  config: ObjectConfig;     // type-specific config (inline for non-text overlays)
}

// ─── Object Configs (type-specific) ─────────────────────────────

interface SubtitleConfig {
  originalText: string;
  translatedText: string;
  isNew: boolean;
}

interface BackgroundOverlayConfig {
  color: string;
  opacity: number;
}

interface BlurOverlayConfig {
  color: string;
  opacity: number;
}

interface MirrorOverlayConfig {
  rotate180: boolean;
}

interface TextOverlayConfig {
  text: string;
  // Visual properties in styleId reference
}

interface LogoOverlayConfig {
  assetId: string;          // reference to Asset
  opacity: number;
}

interface WatermarkOverlayConfig {
  assetId: string;          // reference to Asset
  opacity: number;
}

type ObjectConfig =
  | SubtitleConfig
  | BackgroundOverlayConfig
  | BlurOverlayConfig
  | MirrorOverlayConfig
  | TextOverlayConfig
  | LogoOverlayConfig
  | WatermarkOverlayConfig;

// ─── Style ───────────────────────────────────────────────────────

type StyleType = "subtitle" | "text";

interface EditorStyle {
  id: string;
  type: StyleType;
  name: string;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  bgColor: string;
  bgShape: "box" | "rounded" | "none";
  bgOpacity: number;          // 0-100
  position: SubtitlePosition; // named position (9-grid)
}

type SubtitlePosition =
  | "top-left" | "top-center" | "top-right"
  | "middle-left" | "center" | "middle-right"
  | "bottom-left" | "bottom-center" | "bottom-right";
```

### 2.2 Viewport (`viewport/types.ts`)

```typescript
interface Viewport {
  // Container dimensions (actual screen pixels)
  containerWidth: number;
  containerHeight: number;
  // Computed video display area
  displayWidth: number;
  displayHeight: number;
  offsetX: number;
  offsetY: number;
  // Scale factors
  scaleX: number;  // displayWidth / coordinateSpace.width
  scaleY: number;  // displayHeight / coordinateSpace.height
}
```

### 2.3 Scene Graph (`scene/types.ts`)

```typescript
type SceneNodeType =
  | "video"
  | "group"
  | "text"
  | "image"
  | "blur"
  | "mirror"
  | "background";

interface SceneNode {
  id: string;
  type: SceneNodeType;
  transform: ScreenTransform;  // Already converted to screen coords
  visible: boolean;
  children?: SceneNode[];      // For GroupNode
  data: SceneNodeData;         // Type-specific render data
}

interface ScreenTransform {
  x: number;      // screen pixels
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number; // 0-1
}

// Node-specific data (discriminated by SceneNode.type)
interface VideoNodeData {
  assetSource: string;
  currentTime: number;
}

interface TextNodeData {
  text: string;
  fontFamily: string;
  fontSize: number;   // screen-scaled
  color: string;
  bgColor: string;
  bgShape: string;
  bgOpacity: number;
}

interface ImageNodeData {
  source: string;
  objectFit: "contain" | "cover" | "fill";
}

interface BlurNodeData {
  color: string;
  blurAmount: number;
}

interface MirrorNodeData {
  sourceRegion: { x: number; y: number; width: number; height: number }; // design coords
  rotate180: boolean;
  videoElement: HTMLVideoElement | null; // runtime reference
}

interface BackgroundNodeData {
  color: string;
  opacity: number;
}

type SceneNodeData =
  | VideoNodeData
  | TextNodeData
  | ImageNodeData
  | BlurNodeData
  | MirrorNodeData
  | BackgroundNodeData;

interface SceneGraph {
  nodes: SceneNode[];
  viewport: Viewport;
  currentTime: number;
}
```

### 2.4 Renderer Interface (`renderer/types.ts`)

```typescript
interface Renderer {
  render(scene: SceneGraph): React.ReactNode;
  dispose?(): void;
}
```

---

## 3. Data Flow

```text
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                          │
│  (drag, resize, edit text, change style, seek, play/pause)       │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     VIEWPORT CONVERSION                           │
│  screenToProject(mousePos, viewport) → design coordinate         │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PROJECT STORE (Zustand)                       │
│  project: Project                                                │
│  updateObject(id, changes) → mutate project.objects              │
│  updateStyle(id, changes) → mutate project.styles                │
│  addAsset(asset) → mutate project.assets                         │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SCENE BUILDER (useMemo)                       │
│  buildScene(project, currentTime, viewport) → SceneGraph         │
│  • Filter objects by currentTime (visibility)                    │
│  • Resolve styleId → style properties                            │
│  • Convert design coords → screen coords                         │
│  • Build node tree (GroupNodes for subtitle/text)                │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     HTML RENDERER                                 │
│  render(scene: SceneGraph) → React elements                      │
│  • VideoNode → <video> element                                   │
│  • GroupNode → <div> wrapper with Rnd                            │
│  • TextNode → <span> with styles                                 │
│  • ImageNode → <img> element                                     │
│  • BlurNode → <div> with backdrop-filter                         │
│  • MirrorNode → <canvas> with frame sampling                     │
│  • BackgroundNode → <div> with background color                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Store Architecture

```typescript
// New store shape
interface EditorStoreState {
  // Core data — Single Source of Truth
  project: Project | null;

  // Playback (ephemeral)
  currentTime: number;
  isPlaying: boolean;

  // Viewport (ephemeral, computed from container)
  viewport: Viewport;

  // Scene (derived, memoized)
  // NOT stored — computed via useMemo in component

  // UI state (ephemeral)
  isDirty: boolean;
  isLoading: boolean;
  error: string | null;
  selectedObjectId: string | null;
}

interface EditorStoreActions {
  // Project lifecycle
  loadProject(projectId: string): Promise<void>;
  loadRecentProject(): Promise<void>;
  saveProject(): Promise<void>;

  // Object CRUD
  addObject(type: ObjectType, config?: Partial<ObjectConfig>): string; // returns id
  removeObject(id: string): void;
  updateObject(id: string, updates: Partial<EditorObject>): void;
  updateObjectTransform(id: string, transform: Partial<Transform>): void;
  toggleObject(id: string): void;

  // Style CRUD
  addStyle(style: EditorStyle): void;
  updateStyle(id: string, updates: Partial<EditorStyle>): void;
  removeStyle(id: string): void;
  applyStyleToObject(objectId: string, styleId: string): void;

  // Asset CRUD
  addAsset(asset: Asset): string; // returns id
  removeAsset(id: string): void;

  // Subtitle-specific helpers
  updateSubtitleText(id: string, field: "originalText" | "translatedText", value: string): void;
  addSubtitleAfter(afterId?: string): string;
  toggleApplyAll(): void;

  // Viewport
  updateViewport(container: { width: number; height: number }, videoAspect: number): void;

  // Playback
  setCurrentTime(time: number): void;
  seekTo(time: number): void;
  setPlaying(playing: boolean): void;

  // Selection
  selectObject(id: string | null): void;

  // Utility
  resetDirty(): void;
  clearError(): void;
}
```

---

## 5. Module Dependencies

```text
model/types.ts          ← No dependencies (pure types)
     │
     ├── assets/AssetRegistry.ts    ← depends on model/types (Asset)
     │
     ├── viewport/types.ts          ← depends on model/types (CoordinateSpace, Point)
     │   └── viewport/convert.ts    ← depends on viewport/types
     │   └── viewport/viewport.ts   ← depends on viewport/types
     │
     ├── scene/types.ts             ← depends on model/types, viewport/types
     │   └── scene/builder.ts       ← depends on scene/types, model/types, viewport/convert
     │   └── scene/nodes.ts         ← depends on scene/types
     │
     ├── renderer/types.ts          ← depends on scene/types
     │   └── renderer/HTMLRenderer  ← depends on renderer/types, scene/types
     │
     ├── adapter/legacy.ts          ← depends on model/types + OLD types.ts
     │
     └── store.ts                   ← depends on model/, adapter/, assets/
```

---

## 6. Migration Strategy

### Load Flow (project cũ):
```text
Tauri load_editor_project → EditorProjectData (old format)
  → adapter/legacy.ts: legacyToProject()
  → Project (new format, in-memory)
  → Store
```

### Save Flow:
```text
Store.project (new format)
  → adapter/legacy.ts: projectToLegacy()
  → SaveEditorRequest (old format)
  → Tauri save_editor_project
```

### Conversion Logic (legacyToProject):
1. Create ProjectMetadata from EditorProjectData (id, filename, duration, etc.)
2. Create Video Asset from videoPath
3. Convert each SubtitleCue → EditorObject (type: "subtitle")
4. Convert each OverlayItem → EditorObject (type: overlay type)
5. Convert logo/watermark paths → Asset entries
6. Convert activeStyle → EditorStyle in project.styles
7. Create 3 default Tracks with objectIds
8. Set default ProjectSettings (subtitleApplyAll: true)

---

## 7. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Scene Graph rebuild on every store change (useMemo) | Simple, predictable, fast enough for ~60 objects |
| Viewport as ephemeral (not in Project) | Viewport = runtime display concern, not data |
| Transform.position = null means "use style default" | Supports hybrid named/custom position for subtitles |
| Object.config discriminated by Object.type | Avoids generic `Record<string, unknown>`, type-safe |
| HTMLRenderer receives SceneGraph, not store | Clean separation, ready for renderer swap |
| Asset registry from day 1 | Prepares for export/cache/thumbnail without restructuring later |
| Store remains Zustand (not Redux/MobX) | Existing pattern, team familiarity, lightweight |

---

*Awaiting user approval before proceeding to Units Generation.*
