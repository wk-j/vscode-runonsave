#addin "nuget:?package=Cake.SquareLogo"

Task("Publish").Does(() => {
    StartProcess("vsce", new ProcessSettings {
        Arguments = "publish"
    });
});

Task("Icon").Does(() =>{
    CreateLogo("Save", "images/icon.png", new LogoSettings {
        Background = "Green",
        Foreground = "White",
        Padding = 30
    });
});

var target = Argument("target", "default");
RunTarget(target);