#addin "nuget:?package=Cake.SquareLogo"

Task("Publish").Does(() => {
    StartProcess("vsce", new ProcessSettings {
        Arguments = "publish"
    });
});

Task("Icon").Does(() =>{
    CreateLogo("Run", "images/icon.png", new LogoSettings {
        Background = "OrangeRed",
        FontFamily = "Phosphate",
        Foreground = "White",
        Padding = 50
    });
});

var target = Argument("target", "default");
RunTarget(target);