#!/usr/bin/env python3
"""
simulate_mavros_ros2.py — Simulator Topic MAVROS untuk ROS 2 (Mock Pixhawk)
-------------------------------------------------------------------------
Script ini bertindak sebagai "MAVROS Palsu" yang mempublikasikan data pergerakan kapal
ke dalam topic ROS 2 standar MAVROS:
  1. /mavros/global_position/global     (sensor_msgs/msg/NavSatFix)
  2. /mavros/global_position/compass_hdg (std_msgs/msg/Float64)

Cara Penggunaan (2 Terminal):
  Terminal 1 (Simulator MAVROS):
    python3 simulate_mavros_ros2.py

  Terminal 2 (Bridge ke Supabase / Website):
    python3 mavlink_to_supabase.py
    # (Atau: ros2 launch gamantaray_vision supabase_bridge.launch.py)

Dengan cara ini, Anda bisa mensimulasikan pembacaan dari MAVROS -> ROS 2 -> Website
TANPA perlu perangkat keras Pixhawk maupun ArduPilot SITL!
"""

import time
import math
import rclpy
from rclpy.node import Node
from rclpy.qos import qos_profile_sensor_data
from sensor_msgs.msg import NavSatFix
from std_msgs.msg import Float64

class MockMavrosNode(Node):
    def __init__(self):
        super().__init__('mock_mavros_simulator')

        # Publisher untuk meniru topic dari MAVROS asli
        self.gps_pub = self.create_publisher(
            NavSatFix,
            '/mavros/global_position/global',
            qos_profile_sensor_data
        )
        self.hdg_pub = self.create_publisher(
            Float64,
            '/mavros/global_position/compass_hdg',
            qos_profile_sensor_data
        )

        # Titik asal (Lintasan 1 di safinahone.vercel.app)
        self.origin_lat = -7.9154834
        self.origin_lon = 112.5891244

        # Waypoints dalam meter relatif terhadap titik asal
        self.waypoints = [
            (-15.0, -20.0),  # Barat daya
            (-15.0,  20.0),  # Utara barat
            (  0.0,  25.0),  # Utara tengah
            ( 15.0,  20.0),  # Timur utara
            ( 15.0, -20.0),  # Timur selatan
            (  0.0, -25.0),  # Selatan tengah
        ]
        self.current_idx = 0
        self.curr_x, self.curr_y = self.waypoints[0]
        self.speed_mps = 2.5  # 2.5 meter per detik (~5 knot)
        self.dt = 0.5         # Publish setiap 0.5 detik (2 Hz)

        # Timer untuk animasi pergerakan
        self.timer = self.create_timer(self.dt, self.timer_callback)

        self.get_logger().info("======================================================")
        self.get_logger().info("  MOCK MAVROS SIMULATOR BERJALAN (ROS 2)")
        self.get_logger().info("  Topic GPS:     /mavros/global_position/global")
        self.get_logger().info("  Topic Heading: /mavros/global_position/compass_hdg")
        self.get_logger().info("======================================================")

    def get_lat_lon(self, dx_meters, dy_meters):
        earth_radius = 6378137.0
        d_lat = (dy_meters / earth_radius) * (180.0 / math.pi)
        d_lon = (dx_meters / (earth_radius * math.cos(math.radians(self.origin_lat)))) * (180.0 / math.pi)
        return self.origin_lat + d_lat, self.origin_lon + d_lon

    def timer_callback(self):
        target_idx = (self.current_idx + 1) % len(self.waypoints)
        target_x, target_y = self.waypoints[target_idx]

        dx = target_x - self.curr_x
        dy = target_y - self.curr_y
        dist = math.sqrt(dx*dx + dy*dy)

        if dist <= self.speed_mps * self.dt:
            self.curr_x, self.curr_y = target_x, target_y
            self.current_idx = target_idx
        else:
            self.curr_x += (dx / dist) * (self.speed_mps * self.dt)
            self.curr_y += (dy / dist) * (self.speed_mps * self.dt)

        lat, lon = self.get_lat_lon(self.curr_x, self.curr_y)

        # Hitung Heading / COG (0 = Utara, 90 = Timur)
        yaw_deg = math.degrees(math.atan2(dx, dy))
        if yaw_deg < 0:
            yaw_deg += 360.0

        # 1. Publish ke /mavros/global_position/global (NavSatFix)
        gps_msg = NavSatFix()
        gps_msg.header.stamp = self.get_clock().now().to_msg()
        gps_msg.header.frame_id = "map"
        gps_msg.latitude = float(lat)
        gps_msg.longitude = float(lon)
        gps_msg.altitude = 0.0
        self.gps_pub.publish(gps_msg)

        # 2. Publish ke /mavros/global_position/compass_hdg (Float64)
        hdg_msg = Float64()
        hdg_msg.data = float(yaw_deg)
        self.hdg_pub.publish(hdg_msg)

        self.get_logger().info(f"[Publish MAVROS] Lat: {lat:.6f} | Lon: {lon:.6f} | Hdg: {yaw_deg:.1f}°")

def main(args=None):
    rclpy.init(args=args)
    node = MockMavrosNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
