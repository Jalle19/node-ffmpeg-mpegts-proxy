# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  
  # sysvinit based
  config.vm.define "wheezy" do |wheezy|
    wheezy.vm.box = "debian/wheezy64"
    
    # install ffmpeg
    wheezy.vm.provision "shell", inline: <<-SHELL
      sudo apt-get install -y ffmpeg
    SHELL
  end
  
  # upstart based
  config.vm.define "trusty" do |trusty|
    trusty.vm.box = "geerlingguy/ubuntu1404"
    
    # install avconv
    trusty.vm.provision "shell", inline: <<-SHELL
    sudo apt-get install -y libav-tools
    SHELL
  end
  
  # systemd based
  config.vm.define "xenial" do |xenial|
    xenial.vm.box = "geerlingguy/ubuntu1604"
    
    # install ffmpeg
    xenial.vm.provision "shell", inline: <<-SHELL
    sudo apt-get install -y ffmpeg
  SHELL
  end
  
  # common provisioning (install nodejs)
  config.vm.provision "shell", inline: <<-SHELL
    sudo apt-get update
    sudo apt-get install -y curl ca-certificates apt-transport-https
    curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
    sudo apt-get install -y nodejs
  SHELL
  
end
