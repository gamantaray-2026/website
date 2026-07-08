import os
import time
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import NavSatFix
from std_msgs.msg import Float64
from supabase import create_client, Client

# Konfigurasi Supabase (baca dari .env.local)
def load_env_local():
    env_vars = {}
    try:
        with open('.env.local', 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    key, val = line.split('=', 1)
                    env_vars[key.strip()] = val.strip()
    except FileNotFoundError:
        pass
    return env_vars

env = load_env_local()
url: str = env.get("NEXT_PUBLIC_SUPABASE_URL", "")
key: str = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")

if not url or not key:
    raise ValueError("URL atau Key Supabase tidak ditemukan!")

supabase: Client = create_client(url, key)

from rclpy.qos import qos_profile_sensor_data

class MavrosToSupabaseNode(Node):
    def __init__(self):
        super().__init__('mavros_to_supabase')
        
        self.current_lat = 0.0
        self.current_lon = 0.0
        self.current_heading = 0.0
        
        self.last_update = time.time()
        self.update_interval = 1.0  # kirim setiap 1 detik
        
        self.get_logger().info("Menunggu data dari MAVROS (ROS 2)...")
        
        # Subscribers
        self.gps_sub = self.create_subscription(
            NavSatFix,
            '/mavros/global_position/global',
            self.gps_callback,
            qos_profile_sensor_data)
        self.heading_sub = self.create_subscription(
            Float64,
            '/mavros/global_position/compass_hdg',
            self.heading_callback,
            qos_profile_sensor_data)

    def heading_callback(self, msg):
        self.current_heading = msg.data

    def gps_callback(self, msg):
        self.current_lat = msg.latitude
        self.current_lon = msg.longitude
        
        now = time.time()
        if now - self.last_update >= self.update_interval:
            try:
                # Insert Nav Data
                supabase.table("nav_data").insert({
                    "latitude": self.current_lat,
                    "longitude": self.current_lon,
                    "sog_ms": 2.0
                }).execute()
                
                # Insert Heading (COG)
                supabase.table("cog_data").insert({
                    "cog": self.current_heading
                }).execute()
                
                self.get_logger().info(f"[Supabase Sync] Terkirim! Lat: {self.current_lat:.6f}, Lon: {self.current_lon:.6f}, Hdg: {self.current_heading:.1f}")
                self.last_update = now
            except Exception as e:
                self.get_logger().error(f"Error ke Supabase: {e}")

def main(args=None):
    rclpy.init(args=args)
    node = MavrosToSupabaseNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
