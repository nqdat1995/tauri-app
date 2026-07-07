# Video Editor Refactoring Plan - Foundation

> Mục tiêu:
>
> Xây dựng nền tảng kiến trúc mới cho Editor mà **không thay đổi Renderer hiện tại**.
>
> Sau khi hoàn thành tài liệu này:
>
> * HTML + CSS hiện tại vẫn hoạt động.
> * Có thể tiếp tục dùng react-rnd.
> * Không ảnh hưởng Preview.
> * Chuẩn bị sẵn kiến trúc cho Konva / Canvas / Export sau này.

---

# Phase 1 - Chuẩn hóa Project Model

## Mục tiêu

Project phải trở thành **Single Source of Truth**.

Không còn state rải rác trong Component.

Không còn lưu Position bên trong React Component.

Không còn phụ thuộc DOM.

---

## Kiến trúc

```text
Project

├── Metadata

├── Assets

├── Tracks

├── Objects

├── Styles

├── Timeline

└── Settings
```

---

## Metadata

Metadata mô tả Project.

Ví dụ

```typescript
interface ProjectMetadata {

    id: string;

    name: string;

    fps: number;

    duration: number;

    coordinateSpace: CoordinateSpace;

}
```

---

## Assets

Ví dụ

```typescript
interface Asset {

    id: string;

    type:

        | "video"

        | "audio"

        | "image"

        | "font";

    source: string;

}
```

---

## Track

Track chỉ mô tả Timeline.

```typescript
interface Track {

    id: string;

    type:

        | "video"

        | "subtitle"

        | "overlay"

        | "audio";

    objectIds: string[];

}
```

---

## Object

Object chỉ mô tả dữ liệu.

Ví dụ

```typescript
interface EditorObject {

    id: string;

    type:

        | "text"

        | "image"

        | "shape";

    startTime: number;

    endTime: number;

    transform: Transform;

    styleId: string;

}
```

Object không biết Renderer.

---

## Style

Tách Style khỏi Object.

Ví dụ

```typescript
interface TextStyle {

    id: string;

    fontFamily: string;

    fontSize: number;

    color: string;

    strokeColor: string;

}
```

Object chỉ lưu

```text
styleId
```

---

## Store

Khuyến nghị

```text
projectStore

↓

Project
```

Không tạo

```text
subtitleStore

overlayStore

videoStore
```

riêng lẻ.

Project là nguồn dữ liệu duy nhất.

---

# Phase 2 - Coordinate Space

## Mục tiêu

Toàn bộ Editor chỉ sử dụng **một hệ tọa độ duy nhất**.

Không phụ thuộc Window.

Không phụ thuộc Zoom.

Không phụ thuộc Fullscreen.

---

## Coordinate Space

Ví dụ

```typescript
interface CoordinateSpace {

    width: number;

    height: number;

}
```

Ví dụ

```typescript
1920 × 1080
```

---

## Project

```text
Project

↓

Metadata

↓

CoordinateSpace
```

Ví dụ

```typescript
coordinateSpace:

{

    width:1920,

    height:1080

}
```

---

## Object Position

Ví dụ

```typescript
position:

{

    x:840,

    y:900

}
```

Ý nghĩa

```
840

trong hệ tọa độ Project

KHÔNG PHẢI

840 pixel màn hình.
```

---

## Viewport

Viewport chỉ làm nhiệm vụ

```text
Coordinate Convert
```

Ví dụ

```text
Project

↓

Viewport

↓

Screen
```

---

## Resize

Resize chỉ thay đổi

```text
Viewport.scale
```

Không sửa Object.

---

## Fullscreen

Fullscreen

↓

Scale

↓

Render

Không sửa Position.

---

## Interaction

Mouse

↓

Viewport Coordinate

↓

Project Coordinate

↓

Update Project

---

## Nguyên tắc

Không lưu

```text
Viewport Coordinate
```

vào Project.

Chỉ lưu

```text
Design Coordinate
```

---

# Phase 3 - Scene Graph

## Mục tiêu

Scene Graph trở thành lớp trung gian giữa

Project

và

Renderer.

---

## Kiến trúc

```text
Project

↓

Scene Builder

↓

Scene Graph

↓

Renderer
```

---

## Vì sao cần Scene Graph?

Project

lưu dữ liệu.

Scene Graph

lưu trạng thái đã Resolve.

Ví dụ

```text
Cue

↓

Style

↓

Animation

↓

TextNode
```

---

## Scene Graph

Ví dụ

```text
Scene

├── VideoNode

├── ImageNode

├── TextNode

├── ShapeNode

└── GroupNode
```

---

## Node

Ví dụ

```typescript
interface SceneNode {

    id:string;

    type:string;

    transform:Transform;

    visible:boolean;

}
```

---

## Text Node

```typescript
interface TextNode {

    text:string;

    font:Font;

    transform:Transform;

}
```

---

## Image Node

```typescript
interface ImageNode {

    assetId:string;

    transform:Transform;

}
```

---

## Group

Ví dụ

```text
Subtitle

↓

Background

+

Text
```

Group cho phép

* Move
* Rotate
* Scale

cùng lúc.

---

## Scene Builder

Scene Builder chịu trách nhiệm

```text
Project

↓

Read Object

↓

Resolve Style

↓

Resolve Visibility

↓

Resolve Timeline

↓

Scene Graph
```

---

## Không Render

Scene Builder

không vẽ.

Chỉ sinh Scene.

---

## Timeline

Scene Builder chỉ đưa Object đang hoạt động.

Ví dụ

```
Current Time

↓

1500 ms
```

↓

Object A

Visible

↓

Object B

Hidden

---

## Renderer

Renderer chỉ nhận

```text
Scene Graph
```

Không đọc

Project.

---

## Interaction

Interaction chỉ Update

Project.

Không Update

Scene Graph.

Scene Graph sẽ được Build lại.

---

# Kiến trúc dữ liệu

```text
                   Project
                       │
                       ▼
                Scene Builder
                       │
                       ▼
                 Scene Graph
                       │
                HTML Renderer
```

Hiện tại

Renderer vẫn là

```text
HTML

+

CSS

+

react-rnd
```

Không thay đổi.

---

# Quy trình Render

```text
Project

↓

Scene Builder

↓

Scene Graph

↓

HTML Renderer

↓

DOM
```

---

# Quy trình Drag

```text
Mouse

↓

react-rnd

↓

Viewport Coordinate

↓

Project Coordinate

↓

Update Project

↓

Scene Builder

↓

Renderer
```

---

# Quy trình Resize

```text
Mouse

↓

Viewport

↓

Coordinate Convert

↓

Project

↓

Scene

↓

Render
```

---

# Quy trình Timeline

```text
Current Time

↓

Scene Builder

↓

Visible Nodes

↓

Renderer
```

---

# Quy trình Zoom

```text
Zoom

↓

Viewport

↓

Scale

↓

Renderer
```

Project không thay đổi.

---

# Tiêu chí hoàn thành

## Phase 1

* Tất cả dữ liệu Editor đều nằm trong Project.
* Không còn state vị trí nằm rải rác trong Component.
* Style được tách khỏi Object.

---

## Phase 2

* Chỉ tồn tại một Coordinate Space.
* Resize và Fullscreen không làm thay đổi dữ liệu Project.
* Mọi thao tác Interaction đều được quy đổi về Design Coordinate trước khi lưu.

---

## Phase 3

* Renderer không đọc trực tiếp Project.
* Renderer chỉ đọc Scene Graph.
* Scene Graph được xây dựng lại từ Project sau mỗi thay đổi.
* HTML + CSS + react-rnd vẫn hoạt động bình thường.

---

# Kết quả mong muốn

Sau khi hoàn thành ba Phase này:

* Giao diện hiện tại gần như không thay đổi.
* Không cần viết lại HTML.
* Không cần chuyển sang Konva.
* Không ảnh hưởng đến Video Player.
* Không ảnh hưởng đến CSS.
* Không ảnh hưởng đến react-rnd.
* Toàn bộ nền tảng dữ liệu đã sẵn sàng để sau này thay thế HTML Renderer bằng Konva Renderer hoặc Canvas Renderer mà không phải thay đổi Project Model hay Scene Graph.
 