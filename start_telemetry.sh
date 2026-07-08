#!/bin/bash
source /opt/ros/jazzy/setup.bash

echo "Starting MAVROS on UDP 14550..."
ros2 run mavros mavros_node --ros-args -p fcu_url:=udp://:14550@ &
MAVROS_PID=$!

echo "Waiting for MAVROS to initialize..."
sleep 3

echo "Starting Supabase Sync Script..."
python3 mavlink_to_supabase.py &
SYNC_PID=$!

echo "Telemetry is running in the background."
echo "To stop, run: kill $MAVROS_PID $SYNC_PID"

wait
