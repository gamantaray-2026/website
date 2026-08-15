# Graph Report - .  (2026-07-30)

## Corpus Check
- 69 files · ~52,261 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 427 nodes · 536 edges · 39 communities (33 shown, 6 thin omitted)
- Extraction: 75% EXTRACTED · 24% INFERRED · 1% AMBIGUOUS · INFERRED: 128 edges (avg confidence: 0.84)
- Token cost: 731,725 input · 0 output

## Community Hubs (Navigation)
- Leaflet Map and Buoy Markers
- Guides, Docs and Camera Test Page
- Dashboard UI Components
- Build Tooling and Dev Dependencies
- TypeScript Configuration
- Runtime Dependencies
- Mission Control Dashboard Screenshot
- UL Camera Frame 1782978295144
- SR Camera Frame 1782978296445
- SL Camera Frame 1782978669703
- UL Camera Frame 1782978671469
- UR Camera Frame 1782978675546
- SVG Icon Assets
- Boat Top-Down Render Asset
- SL Camera Frame 1782978293477
- UR Camera Frame 1782978298558
- SR Camera Frame 1782978673543
- MAVLink to Supabase Bridge
- Buoy Seeding Script
- GPS Simulation Script
- Database Check Script
- Graphify Workflow Rules
- Fake LiDAR ROS2 Node
- Logo Brand Identity
- Green Background Tile Asset
- Start Finish Banner Asset
- Uploaded Logo Asset
- App Router Favicon
- Map Marker Color Conventions
- Red Buoy Photo Asset
- Root Layout and Fonts
- Theme Fix Script
- ESLint Config
- Next.js Config
- PostCSS Config
- SITL Launch Script
- Telemetry Launch Script

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `camera_UL Capture Frame (Indoor Workshop, Upward Tilt)` - 10 edges
3. `Safinah One Mission Control Dashboard (UI Screenshot)` - 9 edges
4. `Camera UR Frame Capture (Indoor Lab Scene)` - 9 edges
5. `Real-Time Map Panel` - 8 edges
6. `Top-Down Boat Render (kapalasli3.png)` - 8 edges
7. `Camera SR Capture 1782978673543` - 8 edges
8. `include` - 7 edges
9. `Graphify Knowledge Graph Workflow` - 7 edges
10. `Next.js Project (create-next-app)` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Object_under` --references--> `bawah.png - Submerged Object Map Marker Asset`  [INFERRED]
  src/components/dashboard/MapLeaflet.tsx → public/bawah.png
- `Obstacle Avoidance Demonstration (ROS 2 + LiDAR + Pixhawk SITL)` --semantically_similar_to--> `Gamantaray Simulation Workflow (SITL + ROS 2 + Web)`  [INFERRED] [semantically similar]
  OBSTACLE_AVOIDANCE_GUIDE.md → SIMULATION_GUIDE.md
- `fake_lidar_ros2.py Fake LiDAR Publisher` --semantically_similar_to--> `mavlink_to_supabase.py Sync Script`  [INFERRED] [semantically similar]
  OBSTACLE_AVOIDANCE_GUIDE.md → TELEMETRY_GUIDE.md
- `Gamantaray Camera API Tester Page` --semantically_similar_to--> `fake_lidar_ros2.py Fake LiDAR Publisher`  [INFERRED] [semantically similar]
  public/test_camera.html → OBSTACLE_AVOIDANCE_GUIDE.md
- `Gamantaray Telemetry Pipeline (Pixhawk to Website)` --semantically_similar_to--> `Gamantaray Simulation Workflow (SITL + ROS 2 + Web)`  [INFERRED] [semantically similar]
  TELEMETRY_GUIDE.md → SIMULATION_GUIDE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **SITL to Web Real-Time Visualization Stack** — simulation_guide_sitl_sim_vehicle, simulation_guide_mavros_node, simulation_guide_rosbridge_server, simulation_guide_roslib_web_client, simulation_guide_gamantaray_web [EXTRACTED 1.00]
- **LiDAR to Pixhawk Obstacle Avoidance Loop** — obstacle_avoidance_guide_fake_lidar_ros2, obstacle_avoidance_guide_obstacle_send_topic, obstacle_avoidance_guide_prx_type, obstacle_avoidance_guide_oa_type, obstacle_avoidance_guide_bendyruler, obstacle_avoidance_guide_pixhawk_ardurover [EXTRACTED 1.00]
- **Field Telemetry Chain (Pixhawk to Website via Supabase)** — telemetry_guide_nuc_companion_computer, telemetry_guide_mavproxy_forwarder, telemetry_guide_start_telemetry_sh, telemetry_guide_mavlink_to_supabase, telemetry_guide_supabase_backend, simulation_guide_gamantaray_web [EXTRACTED 1.00]
- **Four Panels Composing the Mission Control View** — final_header_bar, final_navigation_data_panel, final_mission_log_panel, final_realtime_map_panel, final_camera_feeds_panel [EXTRACTED 1.00]
- **Offline / Missing-Data Presentation Pattern** — final_no_camera_placeholder, final_em_dash_null_telemetry, final_manual_refresh_control, final_wib_timestamp_convention [INFERRED 0.75]
- **Course Navigation Model (Track, Grid, Waypoints, Buoys, GNSS)** — final_lintasan_track_selector, final_grid_zone_overlay, final_start_finish_waypoints, final_red_green_buoy_markers, final_gnss_telemetry [INFERRED 0.85]
- **Halftone Green Background Visual Composition** — public_atas_asset, public_atas_halftone_dot_pattern, public_atas_green_gradient, public_atas_seamless_tile_geometry [INFERRED 0.85]
- **Deck Layout Composition of the Top-Down Boat Render** — public_kapalasli3_bow_deck, public_kapalasli3_cockpit_seating, public_kapalasli3_helm_console, public_kapalasli3_stern_platform, public_kapalasli3_teak_deck [INFERRED 0.85]
- **Manta-Ray Brandmark Visual Identity System** — public_logo_brandmark, public_logo_manta_ray_motif, public_logo_vessel_hull_silhouette, public_logo_lime_green_brand_color, public_logo_negative_space_linework [INFERRED 0.85]
- **START/FINISH Banner Pair Forming a Race Course Illustration** — public_start_start_banner, public_start_finish_banner, public_start_race_course_metaphor, public_start_start_finish_banner_image [INFERRED 0.85]
- **Manta Ray Logo Brand System (motif, accent color, flat transparent treatment)** — public_uploads_1782895401493_logo_logo_mark, public_uploads_1782895401493_logo_manta_ray_motif, public_uploads_1782895401493_logo_lime_accent_color, public_uploads_1782895401493_logo_transparent_flat_vector_style, public_uploads_1782895401493_logo_asv_team_identity [INFERRED 0.85]
- **Indoor Scene Composition Seen by Camera SL** — public_uploads_1782978293477_camera_sl_timber_roof_truss, public_uploads_1782978293477_camera_sl_steel_storage_cabinets, public_uploads_1782978293477_camera_sl_wayang_golek_puppets, public_uploads_1782978293477_camera_sl_foreground_occlusion [INFERRED 0.85]
- **Indoor Workshop Scene Elements Framed by camera_UL** — public_uploads_1782978295144_camera_ul_exposed_timber_roof_truss, public_uploads_1782978295144_camera_ul_trophy_display_shelf, public_uploads_1782978295144_camera_ul_steel_storage_cabinet, public_uploads_1782978295144_camera_ul_indoor_workshop_scene [EXTRACTED 1.00]
- **Evidence That This Is a Bench Test, Not an On-Water Capture** — public_uploads_1782978295144_camera_ul_indoor_workshop_scene, public_uploads_1782978295144_camera_ul_operator_head_occlusion, public_uploads_1782978295144_camera_ul_low_resolution_vga_capture, public_uploads_1782978295144_camera_ul_bench_test_not_on_water [INFERRED 0.85]
- **Indoor loft scene elements framed by the SR camera** — public_uploads_1782978296445_camera_sr_timber_roof_truss, public_uploads_1782978296445_camera_sr_wayang_golek_display, public_uploads_1782978296445_camera_sr_trophy_shelf, public_uploads_1782978296445_camera_sr_open_metal_chests [EXTRACTED 1.00]
- **Signals that this SR frame is a dry indoor test capture, not an on-water run** — public_uploads_1782978296445_camera_sr_indoor_storage_scene, public_uploads_1782978296445_camera_sr_foreground_occlusion, public_uploads_1782978296445_camera_sr_vga_low_quality_frame, public_uploads_1782978296445_camera_sr_dry_bench_test_evidence [INFERRED 0.85]
- **Indoor Staging Scene Captured by Camera UR** — public_uploads_1782978298558_camera_ur_capture, public_uploads_1782978298558_camera_ur_indoor_pavilion_scene, public_uploads_1782978298558_camera_ur_open_equipment_trunks, public_uploads_1782978298558_camera_ur_wayang_puppet_display, public_uploads_1782978298558_camera_ur_operator_head_occlusion [INFERRED 0.85]
- **Visual evidence that camera_SL was captured on the bench, not on water** — public_uploads_1782978669703_camera_sl_indoor_workshop_scene, public_uploads_1782978669703_camera_sl_operator_occlusion, public_uploads_1782978669703_camera_sl_exposed_timber_roof_truss, public_uploads_1782978669703_camera_sl_bench_test_capture [INFERRED 0.85]
- **Frame-quality defects limiting this capture's use as perception data** — public_uploads_1782978669703_camera_sl_operator_occlusion, public_uploads_1782978669703_camera_sl_low_light_fixed_exposure, public_uploads_1782978669703_camera_sl_low_mount_upward_tilt, public_uploads_1782978669703_camera_sl_capture [INFERRED 0.75]
- **Indoor Team Workshop Scene Elements Framed by the UL Camera** — public_uploads_1782978671469_camera_ul_steel_storage_cabinets, public_uploads_1782978671469_camera_ul_trophy_display, public_uploads_1782978671469_camera_ul_timber_roof_truss, public_uploads_1782978671469_camera_ul_operator_head_occlusion [INFERRED 0.85]
- **Indoor Bench-Test Evidence Set (no water horizon, occluded lens, cluttered room)** — public_uploads_1782978673543_camera_sr_capture, public_uploads_1782978673543_camera_sr_indoor_workshop_scene, public_uploads_1782978673543_camera_sr_occluding_human_head, public_uploads_1782978673543_camera_sr_bench_test_capture [INFERRED 0.85]
- **Vision Quality Limitations of the UR Camera Capture** — public_uploads_1782978675546_camera_ur_foreground_occlusion, public_uploads_1782978675546_camera_ur_upward_pitch_framing, public_uploads_1782978675546_camera_ur_low_resolution_feed, public_uploads_1782978675546_camera_ur_frame [INFERRED 0.75]
- **Indoor Team Lab Staging Scene Composition** — public_uploads_1782978675546_camera_ur_indoor_lab_environment, public_uploads_1782978675546_camera_ur_trophy_display, public_uploads_1782978675546_camera_ur_component_storage_cabinets, public_uploads_1782978675546_camera_ur_bench_test_capture [INFERRED 0.85]
- **Manta Ray Brand Identity Expressed Through the Favicon** — src_app_icon_favicon, src_app_icon_manta_ray_mark, src_app_icon_lime_brand_color, src_app_icon_asv_team_identity [INFERRED 0.85]
- **ASV Leaflet Map Marker Icon Set** — public_atas_surface_object_marker, public_bawah_submerged_object_marker, public_bulat_hijau_green_buoy_marker, public_bulat_merah_red_buoy_marker, public_ship_asv_hull_marker, public_start_start_waypoint_marker, public_ping_center_edit_pin [INFERRED 0.85]
- **create-next-app Scaffold Brand and UI Assets** — public_next_nextjs_wordmark, public_vercel_vercel_triangle_logo, public_file_document_icon, public_globe_globe_icon, public_window_browser_window_icon [INFERRED 0.95]
- **Navigation Gate and Detected-Object Map Overlay** — public_bulat_merah_red_buoy_marker, public_bulat_hijau_green_buoy_marker, public_atas_surface_object_marker, public_bawah_submerged_object_marker, public_bulat_merah_lateral_buoy_color_convention [INFERRED 0.75]

## Communities (39 total, 6 thin omitted)

### Community 0 - "Leaflet Map and Buoy Markers"
Cohesion: 0.07
Nodes (38): bawah.png - Submerged Object Map Marker Asset, Depth Color-Coding Convention for Map Object Markers, Green Buoy Product Photo (hijau.png), Green Navigation Buoy, Green Buoy Map Marker Asset, ensureWaypoints(), fallbackCenters, makeDefaultWaypoints() (+30 more)

### Community 1 - "Guides, Docs and Camera Test Page"
Cohesion: 0.07
Nodes (38): node_modules/next/dist/docs Reference, Next.js Agent Rules, BendyRuler Path Planner (OA_TYPE=1), fake_lidar_ros2.py Fake LiDAR Publisher, OA_TYPE Parameter (Obstacle Avoidance = 1), Obstacle Avoidance Demonstration (ROS 2 + LiDAR + Pixhawk SITL), /mavros/obstacle/send Topic (sensor_msgs/LaserScan), Pixhawk / ArduRover Flight Controller (+30 more)

### Community 2 - "Dashboard UI Components"
Cohesion: 0.09
Nodes (21): CAMERA_BASE_DATA, CameraFeed, CameraFeedsPanel(), CameraFeedsPanelProps, CameraIcon(), DashboardHeader(), DashboardView(), CogData (+13 more)

### Community 3 - "Build Tooling and Dev Dependencies"
Cohesion: 0.07
Nodes (29): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/leaflet (+21 more)

### Community 4 - "TypeScript Configuration"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 5 - "Runtime Dependencies"
Cohesion: 0.08
Nodes (25): clsx, leaflet, leaflet-rotate, leaflet-rotatedmarker, lucide-react, next, dependencies, clsx (+17 more)

### Community 6 - "Mission Control Dashboard Screenshot"
Cohesion: 0.15
Nodes (21): Autonomous Surface Vehicle Competition Run, Camera Feeds Panel, Dark Theme with Lime Accent Design System, Em-Dash Null Telemetry Placeholder, Four-Camera Rig (SL, UL, SR, UR), GNSS Telemetry (Latitude, Longitude, SoG, CoG), A1-E5 Grid Zone Overlay, Header Bar (Logo, Vessel Name, Clock, Refresh) (+13 more)

### Community 7 - "UL Camera Frame 1782978295144"
Cohesion: 0.27
Nodes (11): ASV Camera Upload Artifact (timestamp-prefixed uploads/), Bench/Indoor Test Capture Rather Than On-Water Mission, Camera Aim and Framing Calibration Evidence, Exposed Timber Roof Truss and Concrete Column, camera_UL Capture Frame (Indoor Workshop, Upward Tilt), Indoor Team Workshop / Storage Room Scene, Low-Resolution VGA-Class Capture Quality, Operator Head Occluding Lower Frame (+3 more)

### Community 8 - "SR Camera Frame 1782978296445"
Cohesion: 0.27
Nodes (11): SR Camera Position (starboard/right-side ASV camera channel), camera_SR Capture Frame (Indoor Storage Room), Dry Bench Test Evidence (no water, no horizon, indoor framing), Foreground Occlusion by Person's Head, Indoor Storage / Workshop Loft Scene, Open Grey Metal Storage Chests / Equipment Cases, Exposed Timber Roof Truss and Tiled Underside, Timestamp-Prefixed Upload Asset in public/uploads (+3 more)

### Community 9 - "SL Camera Frame 1782978669703"
Cohesion: 0.29
Nodes (11): Bench Test Capture, Not On-Water Telemetry, camera_SL Capture Frame (indoor workshop, upward tilt), Exposed Timber Roof Truss and Brick Gable Wall, Indoor Workshop / Team Room Scene, Dim Indoor Lighting with Uncorrected Auto-Exposure, Low Mount / Upward Camera Tilt Geometry, Open Grey Steel Storage Cabinet with Parts Boxes, Operator Head Occluding Lower Frame (+3 more)

### Community 10 - "UL Camera Frame 1782978671469"
Cohesion: 0.31
Nodes (10): Bench Test Capture (Not On-Water Mission Footage), UL (Upper-Left) Camera Mount Position, ASV Upper-Left Camera Capture (Indoor Workshop Scene), Epoch-Timestamp + Camera-ID Upload Filename Convention, Indoor Workshop / Lab Storage Room Scene, Low-Resolution 640x480 Frame Tilted Upward, Operator's Head Occluding Lower Frame, Open Grey Steel Storage Cabinets with Boxes and Parts (+2 more)

### Community 11 - "UR Camera Frame 1782978675546"
Cohesion: 0.33
Nodes (10): Bench Test Capture (Not On-Water Mission Footage), Open Steel Cabinets Holding Parts and Boxes, Foreground Occlusion by Operator's Head, Camera UR Frame Capture (Indoor Lab Scene), Indoor Team Lab / Workshop Environment, Low-Resolution 640x480 Camera Feed, UR Camera Mount Position, Epoch-Timestamped Upload Filename Convention (+2 more)

### Community 12 - "SVG Icon Assets"
Cohesion: 0.33
Nodes (9): Document/File Outline Icon (file.svg), Globe/Meridian Icon (globe.svg), Next.js Starter Template Asset Set, Next.js Wordmark Logo (next.svg), Map Center-Edit Pin Marker (ping.svg), ASV Hull Top-Down Marker (ship.svg), Start Waypoint Play Marker (start.svg), Vercel Triangle Logo (vercel.svg) (+1 more)

### Community 13 - "Boat Top-Down Render Asset"
Cohesion: 0.33
Nodes (9): Top-Down Boat Render (kapalasli3.png), Foredeck with Bow Cleat and Hatch, Cockpit Seating Layout (Facing Bench Pair plus Aft Bench), Transparent-Background Product Cutout Web Asset, Center Helm Console with Wood Dash Panel, Stern Deck / Swim Platform Area, Dark Teak-Style Planked Deck, Vessel Deck-Layout Showcase Imagery (+1 more)

### Community 14 - "SL Camera Frame 1782978293477"
Cohesion: 0.33
Nodes (9): SL Camera Position (side/left camera channel), Camera SL Capture (1782978293477), Dark Foreground Occlusion (likely a person's head close to lens), Indoor Storage / Workshop Interior Scene, Capture Is Not a Maritime Scene (bench-test / indoor capture), Open Steel Storage Cabinets and Wooden Shelving, Timber Roof Truss and Clay Tile Underside with Concrete Columns, Low-Resolution VGA Frame with Upward Tilt and Blown Highlights (+1 more)

### Community 15 - "UR Camera Frame 1782978298558"
Cohesion: 0.36
Nodes (9): Camera UR Capture (1782978298558-camera_UR.jpg), Dry-Land Staging / Pre-Deployment Context (no water visible), Indoor Wooden-Truss Pavilion Scene, Low-Resolution 640x480 Motion-Blurred Frame, Open Metal Equipment Trunks in Foreground, Operator Head Occluding Lower Frame, Upper-Right (UR) Camera Position, Wayang Puppet and Carved Wooden Rack Display (+1 more)

### Community 16 - "SR Camera Frame 1782978673543"
Cohesion: 0.39
Nodes (9): Bench Test Capture (non-operational, not on water), Camera SR Capture 1782978673543, Indoor Workshop / Lab Room Scene, Low-Resolution Wide-Angle VGA Camera Feed, Human Head Occluding Lower Half of Frame, SR Camera Position (starboard/right onboard camera), Open Grey Steel Storage Cabinet with Shelved Boxes, Trophy and Wayang Figurine Display on Cabinet Top (+1 more)

### Community 17 - "MAVLink to Supabase Bridge"
Cohesion: 0.29
Nodes (3): main(), MavrosToSupabaseNode, Node

### Community 18 - "Buoy Seeding Script"
Cohesion: 0.25
Nodes (5): { createClient }, envContent, envVars, fs, supabase

### Community 19 - "GPS Simulation Script"
Cohesion: 0.29
Nodes (7): { createClient }, envContent, envVars, fs, getLatLng(), simulate(), supabase

### Community 20 - "Database Check Script"
Cohesion: 0.29
Nodes (5): { createClient }, envContent, envVars, fs, supabase

### Community 21 - "Graphify Workflow Rules"
Cohesion: 0.38
Nodes (7): GRAPH_REPORT.md, graphify explain, graphify path, graphify query, graphify update, Graphify Wiki Index, Graphify Knowledge Graph Workflow

### Community 22 - "Fake LiDAR ROS2 Node"
Cohesion: 0.38
Nodes (4): FakeLidar, get_yaw(), main(), Node

### Community 23 - "Logo Brand Identity"
Cohesion: 0.48
Nodes (7): Biomimetic Autonomous Surface Vehicle Identity, ASV Team Brandmark (logo.png), Lime Green Brand Color, Manta Ray Motif, Negative-Space Speed Linework, Transparent PNG Web Asset, Vessel Hull and Cockpit Silhouette

### Community 24 - "Green Background Tile Asset"
Cohesion: 0.53
Nodes (6): atas.jpeg - Green Halftone Background Tile, Brand Green Accent Palette, Decorative Background Asset Role, Vertical Green Gradient (dark top to bright bottom), Diagonal Halftone Dot Pattern, Square 225x225 Tileable Geometry

### Community 25 - "Start Finish Banner Asset"
Cohesion: 0.60
Nodes (6): FINISH Banner Graphic, public/ Static Asset Directory, Race Course Start-to-Finish Metaphor, Shutterstock Watermark / Unlicensed Comp Image, START Banner Graphic, Start/Finish Banner Image Asset (start.png)

### Community 26 - "Uploaded Logo Asset"
Cohesion: 0.47
Nodes (6): ASV Team Brand Identity, Lime / Chartreuse Brand Accent Color, Uploaded Team Logo Mark (Manta Ray Silhouette), Manta Ray Motif, User-Uploaded Media Asset (timestamped filename), Flat Single-Color Vector Style on Transparent Background

### Community 27 - "App Router Favicon"
Cohesion: 0.40
Nodes (6): Next.js App Router icon.png File Convention, ASV Team Visual Identity, Site Favicon (App Router icon.png), Lime / Chartreuse Brand Color, Manta Ray Logo Mark, Flat Single-Color Vector Silhouette Style

### Community 28 - "Map Marker Color Conventions"
Cohesion: 0.50
Nodes (5): Surface Object Marker Icon (atas.svg), Submerged Object Marker Icon (bawah.svg), Green Buoy Marker Dot (bulat_hijau.svg), Lateral Buoy Color Convention (Red/Green Gate), Red Buoy Marker Dot (bulat_merah.svg)

### Community 29 - "Red Buoy Photo Asset"
Cohesion: 0.50
Nodes (5): Buoy Color Coding for Autonomous Navigation, Polyform Inflatable Vinyl Marker Buoy, Red Buoy Product Photo (merah.png), Red Channel Marker (Port-Side Navigation Mark), Transparent-Background Product Cutout Web Asset

### Community 30 - "Root Layout and Fonts"
Cohesion: 0.40
Nodes (3): geistMono, inter, metadata

## Ambiguous Edges - Review These
- `Real-Time Map Panel` → `Manual Refresh Control`  [AMBIGUOUS]
  FINAL.png · relation: conceptually_related_to
- `Camera SL Capture (1782978293477)` → `Dark Foreground Occlusion (likely a person's head close to lens)`  [AMBIGUOUS]
  public/uploads/1782978293477-camera_SL.jpg · relation: references
- `Dark Foreground Occlusion (likely a person's head close to lens)` → `Capture Is Not a Maritime Scene (bench-test / indoor capture)`  [AMBIGUOUS]
  public/uploads/1782978293477-camera_SL.jpg · relation: conceptually_related_to
- `Upper-Right (UR) Camera Position` → `Indoor Wooden-Truss Pavilion Scene`  [AMBIGUOUS]
  public/uploads/1782978298558-camera_UR.jpg · relation: conceptually_related_to
- `SL Camera Position (stereo-left / side-left mount)` → `Low Mount / Upward Camera Tilt Geometry`  [AMBIGUOUS]
  public/uploads/1782978669703-camera_SL.jpg · relation: conceptually_related_to

## Knowledge Gaps
- **130 isolated node(s):** `{ createClient }`, `fs`, `envContent`, `envVars`, `supabase` (+125 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Real-Time Map Panel` and `Manual Refresh Control`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Camera SL Capture (1782978293477)` and `Dark Foreground Occlusion (likely a person's head close to lens)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `Dark Foreground Occlusion (likely a person's head close to lens)` and `Capture Is Not a Maritime Scene (bench-test / indoor capture)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Upper-Right (UR) Camera Position` and `Indoor Wooden-Truss Pavilion Scene`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `SL Camera Position (stereo-left / side-left mount)` and `Low Mount / Upward Camera Tilt Geometry`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `dependencies` connect `Runtime Dependencies` to `Build Tooling and Dev Dependencies`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `camera_UL Capture Frame (Indoor Workshop, Upward Tilt)` (e.g. with `Bench/Indoor Test Capture Rather Than On-Water Mission` and `Camera Aim and Framing Calibration Evidence`) actually correct?**
  _`camera_UL Capture Frame (Indoor Workshop, Upward Tilt)` has 4 INFERRED edges - model-reasoned connections that need verification._