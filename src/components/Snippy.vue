<template>
    <div class="robot-container">
        <div class="robot">
            <div class="head">
                <div class="eye left-eye"></div>
                <div class="eye right-eye"></div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "AnimatedRobot",
};
</script>

<style scoped>
.robot-container {
    display: flex;
    justify-content: center;
    height: 150px;
    align-items: center;
    overflow: hidden;
}

.robot {
  position: relative;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(0, 0, 0, 0.6), rgba(159, 244, 154, 0.3));
  border-radius: 50%;
  box-shadow: 0 0 8px #9ff49a, inset 0 0 8px #9ff49a;
  animation:  pulse 2s linear infinite;
  display: flex;
  justify-content: center;
  align-items: center;
}

.head {
    position: relative;
    width: 80px;
    height: 40px;
    background: white;
    border-radius: 20px;
    display: flex;
    justify-content: center;
    gap: 20px;
    align-items: center;
}

.eye {
    width: 10px;
    height: 30px;
    background: #9ff49a;
    border-radius: 5px;
    position: relative;
    animation: blink 3s infinite, lookside 10s infinite;
    overflow: hidden;
}

@keyframes blink {
    0%, 90%, 100% {
        height: 30px;
    }
    95% {
        height: 2px;
    }
}

@keyframes lookside {
    0%, 65%, 100% {
        transform: translateX(0);
    }
    75% {
        transform: translateX(5px);
    }
    85% {
        transform: translateX(-5px);
    }
}

@keyframes float {
    0%, 100% {
        transform: translateY(-5px);
    }
    25% {
        transform: translateY(5px);
    }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 8px #9ff49a, inset 0 0 8px #9ff49a;
  }
  50% {
    box-shadow: 0 0 16px #9ff49a, inset 0 0 14px #9ff49a;
  }
  100% {
    box-shadow: 0 0 8px #9ff49a, inset 0 0 8px #9ff49a;
  }
}
</style>
