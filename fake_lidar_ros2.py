import rclpy
from rclpy.node import Node
from sensor_msgs.msg import LaserScan
from geometry_msgs.msg import PoseStamped
from rclpy.qos import qos_profile_sensor_data
import math

def get_yaw(q):
    siny_cosp = 2 * (q.w * q.z + q.x * q.y)
    cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z)
    return math.atan2(siny_cosp, cosy_cosp)

class FakeLidar(Node):
    def __init__(self):
        super().__init__('fake_lidar_node')
        
        # Publisher untuk LaserScan
        self.publisher_ = self.create_publisher(LaserScan, '/mavros/obstacle/send', 10)
        
        # Subscriber ke posisi lokal kapal menggunakan profil QoS Sensor Data
        self.subscription = self.create_subscription(
            PoseStamped,
            '/mavros/local_position/pose',
            self.pose_callback,
            qos_profile_sensor_data)
            
        self.rock_set = False
        self.rock_x = 0.0
        self.rock_y = 0.0
        
        self.get_logger().info('Fake LiDAR siap. Menunggu data posisi GPS/Lokal dari kapal...')

    def pose_callback(self, msg):
        x = msg.pose.position.x
        y = msg.pose.position.y
        yaw = get_yaw(msg.pose.orientation)
        
        # Saat script baru dijalankan, kita "tanam" batu secara permanen 5 meter di depan kapal
        if not self.rock_set:
            self.rock_x = x + 5.0 * math.cos(yaw)
            self.rock_y = y + 5.0 * math.sin(yaw)
            self.rock_set = True
            self.get_logger().info(f'Batu ajaib ditanam secara permanen di koordinat Dunia (X:{self.rock_x:.2f}, Y:{self.rock_y:.2f})')
            return
            
        # Hitung jarak dan sudut batu dari posisi kapal yang SEKARANG
        dist = math.hypot(self.rock_x - x, self.rock_y - y)
        global_angle = math.atan2(self.rock_y - y, self.rock_x - x)
        
        # Sudut relatif batu terhadap moncong kapal
        rel_angle = global_angle - yaw
        
        # Normalisasi sudut agar selalu di antara -pi sampai pi
        while rel_angle > math.pi: rel_angle -= 2 * math.pi
        while rel_angle < -math.pi: rel_angle += 2 * math.pi
        
        # --- Buat Pesan LaserScan ---
        scan = LaserScan()
        scan.header.stamp = self.get_clock().now().to_msg()
        scan.header.frame_id = 'base_link'
        
        scan.angle_min = -math.pi
        scan.angle_max = math.pi
        scan.angle_increment = math.pi / 180.0
        scan.range_min = 0.2
        scan.range_max = 20.0
        
        ranges = [float('inf')] * 360
        
        # Jika kapal masih berjarak masuk akal dengan batu (0.2m - 20m)
        if 0.2 < dist < 20.0:
            # Cari tahu batu ada di "titik laser" nomor berapa (0 - 359)
            center_idx = int(math.degrees(rel_angle) + 180) % 360
            
            # Buat TEMBOK RAKSASA (mengisi 60 titik laser ke kiri dan 60 ke kanan = 120 derajat!)
            for i in range(-60, 60):
                idx = (center_idx + i) % 360
                ranges[idx] = dist
                
        scan.ranges = ranges
        self.publisher_.publish(scan)

def main(args=None):
    rclpy.init(args=args)
    node = FakeLidar()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
